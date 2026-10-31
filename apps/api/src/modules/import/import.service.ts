import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as csvParse from 'csv-parse/sync';
import * as csvStringify from 'csv-stringify/sync';
import * as ExcelJS from 'exceljs';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import {
  generateActivationCode,
  sha256Hex,
} from '../../common/utils/security-crypto';
import { RoleEnum } from '@grievease/contracts';

export interface ImportPreviewRow {
  rowNo: number;
  raw: Record<string, any>;
  valid: boolean;
  errors: string[];
}

export interface ImportPreviewResult {
  batchId: string;
  fileSha256: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  previewRows: ImportPreviewRow[];
}

@Injectable()
export class ImportService {
  constructor(private auditService: AuditService) {}

  // ==========================================
  // 1. TEMPLATE DOWNLOAD
  // ==========================================
  getTemplateCsv(): string {
    const headers = [
      'member_id',
      'full_name',
      'mobile',
      'email',
      'role',
      'wing',
      'flat',
      'resident_type',
      'verify_detail',
      'area_sqft',
      'flat_type',
      'parking_slots',
      'occupancy',
    ];
    const sampleRows = [
      ['GV-A101-R1', 'Aarav Sharma', '+919876543210', 'aarav@example.com', 'RESIDENT', 'A', '101', 'OWNER', 'A-101', '1250.00', '2BHK', '1', 'OWNER_OCCUPIED'],
      ['GV-B202-R1', 'Meera Patel', '+919876543211', 'meera@example.com', 'RESIDENT', 'B', '202', 'TENANT', '1990-05-12', '950.00', '1BHK', '0', 'TENANT'],
      ['GV-A301-SEC', 'Vikram Singh', '+919876543212', 'vikram@example.com', 'SECRETARY', 'A', '301', 'OWNER', 'A-301', '1800.00', '3BHK', '2', 'OWNER_OCCUPIED'],
    ];

    return csvStringify.stringify([headers, ...sampleRows]);
  }

  // ==========================================
  // 2. PARSE & PREVIEW (WITH HARDENING)
  // ==========================================
  async processUpload(
    fileBuffer: Buffer,
    filename: string,
    societyId: string,
    userId: string
  ): Promise<ImportPreviewResult> {
    // 1. Max size check (5 MB)
    if (fileBuffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds maximum allowed limit of 5 MB.');
    }

    // 2. Extension check & reject macros (.xlsm)
    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith('.xlsm') || lowerName.endsWith('.xltm')) {
      throw new BadRequestException('Macro-enabled spreadsheet files (.xlsm/.xltm) are strictly prohibited.');
    }
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx')) {
      throw new BadRequestException('Only .csv and .xlsx files are supported.');
    }

    // 3. SHA-256 dedupe check
    const fileSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const duplicateCheck = await pool.query(`
      SELECT id, status, created_at FROM import_batch
      WHERE society_id = $1 AND file_sha256 = $2 AND status = 'COMMITTED';
    `, [societyId, fileSha256]);

    if (duplicateCheck.rows.length > 0) {
      throw new BadRequestException('This exact spreadsheet has already been committed to the database.');
    }

    // 4. Parse rows (read values only, disable formula execution)
    let rawRecords: any[] = [];
    if (lowerName.endsWith('.csv')) {
      try {
        rawRecords = csvParse.parse(fileBuffer, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } catch (e: any) {
        throw new BadRequestException(`CSV parsing failed: ${e.message}`);
      }
    } else {
      // XLSX via secure ExcelJS (read cell values without executing formulas)
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet || worksheet.rowCount === 0) {
          throw new BadRequestException('Excel workbook contains no sheets or rows.');
        }

        const headers: Record<number, string> = {};
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value ?? '').trim();
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const record: Record<string, any> = {};
          let hasValue = false;
          row.eachCell((cell, colNumber) => {
            const h = headers[colNumber];
            if (h) {
              const val = cell.value !== null && cell.value !== undefined ? String(cell.value).trim() : '';
              record[h] = val;
              if (val) hasValue = true;
            }
          });
          if (hasValue) {
            rawRecords.push(record);
          }
        });
      } catch (e: any) {
        throw new BadRequestException(`Excel parsing failed: ${e.message}`);
      }
    }

    // Row count check (max 5,000 rows)
    if (rawRecords.length === 0) {
      throw new BadRequestException('Spreadsheet is empty.');
    }
    if (rawRecords.length > 5000) {
      throw new BadRequestException(`Spreadsheet exceeds 5,000 rows limit (found ${rawRecords.length} rows).`);
    }

    // 5. Validate Rows & Check Duplicates
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Fetch existing members in this society
      const existingRes = await client.query(`
        SELECT member_id, mobile, username FROM app_user WHERE society_id = $1;
      `, [societyId]);

      const existingMemberIds = new Set(existingRes.rows.map((r) => (r.member_id || '').toLowerCase()));
      const existingMobiles = new Set(existingRes.rows.map((r) => r.mobile));

      const previewRows: ImportPreviewRow[] = [];
      let validCount = 0;
      let invalidCount = 0;
      let duplicateCount = 0;

      const seenInBatchMemberIds = new Set<string>();
      const seenInBatchMobiles = new Set<string>();

      for (let i = 0; i < rawRecords.length; i++) {
        const row = rawRecords[i];
        const rowNo = i + 2; // spreadsheet 1-indexed header + 1
        const errors: string[] = [];

        const fullName = (row.full_name || '').trim();
        const mobile = (row.mobile || '').trim();
        const role = (row.role || 'RESIDENT').trim().toUpperCase();
        const wing = (row.wing || '').trim();
        const flat = (row.flat || '').trim();
        const verifyDetail = (row.verify_detail || flat || '').trim();
        const memberId = (row.member_id || `GV-${wing}${flat}-${Date.now().toString().slice(-4)}`).trim();

        if (!fullName || fullName.length < 2) errors.push('Full name must be at least 2 characters');
        if (!mobile || !/^[0-9+ -]{10,15}$/.test(mobile)) errors.push('Valid mobile phone number required');
        if (!wing) errors.push('Wing is required');
        if (!flat) errors.push('Flat number is required');
        if (!verifyDetail) errors.push('Verification detail (flat/DOB) is required');

        const roleParse = RoleEnum.safeParse(role);
        if (!roleParse.success) {
          errors.push(`Invalid role '${role}'. Allowed: ${Object.values(RoleEnum.enum).join(', ')}`);
        }

        // Validate optional flat attributes
        if (row.area_sqft !== undefined && row.area_sqft !== '') {
          const area = Number(row.area_sqft);
          if (isNaN(area) || area < 0) errors.push('Area sqft must be a non-negative number');
        }
        if (row.parking_slots !== undefined && row.parking_slots !== '') {
          const slots = Number(row.parking_slots);
          if (isNaN(slots) || !Number.isInteger(slots) || slots < 0) {
            errors.push('Parking slots must be a non-negative integer');
          }
        }
        if (row.occupancy !== undefined && row.occupancy !== '') {
          const occ = String(row.occupancy).trim().toUpperCase();
          if (!['OWNER_OCCUPIED', 'TENANT', 'VACANT'].includes(occ)) {
            errors.push(`Occupancy must be OWNER_OCCUPIED, TENANT, or VACANT (got '${row.occupancy}')`);
          }
        }

        // Validate language preference (only en or hi supported)
        if (row.language !== undefined && row.language !== '') {
          const lang = String(row.language).trim().toLowerCase();
          if (lang === 'mr') {
            errors.push('Language must be en or hi');
          } else if (!['en', 'hi'].includes(lang)) {
            errors.push(`Language must be en or hi (got '${row.language}')`);
          }
        }

        // Duplicate checks
        const lowerMid = memberId.toLowerCase();
        if (existingMemberIds.has(lowerMid) || seenInBatchMemberIds.has(lowerMid)) {
          errors.push(`Duplicate Member ID '${memberId}'`);
          duplicateCount++;
        }
        if (existingMobiles.has(mobile) || seenInBatchMobiles.has(mobile)) {
          errors.push(`Duplicate mobile '${mobile}' already registered`);
          duplicateCount++;
        }

        seenInBatchMemberIds.add(lowerMid);
        seenInBatchMobiles.add(mobile);

        const isValid = errors.length === 0;
        if (isValid) {
          validCount++;
        } else {
          invalidCount++;
        }

        previewRows.push({
          rowNo,
          raw: row,
          valid: isValid,
          errors,
        });
      }

      // 6. Save batch in PREVIEW status
      const batchRes = await client.query(`
        INSERT INTO import_batch (
          society_id, uploaded_by, file_sha256, status, counts
        ) VALUES ($1, $2, $3, 'PREVIEW', $4)
        RETURNING id;
      `, [
        societyId,
        userId,
        fileSha256,
        JSON.stringify({
          total: rawRecords.length,
          valid: validCount,
          invalid: invalidCount,
          duplicates: duplicateCount,
        }),
      ]);

      const batchId = batchRes.rows[0].id;

      // Insert preview rows
      for (const pr of previewRows) {
        await client.query(`
          INSERT INTO import_row (batch_id, row_no, raw, errors)
          VALUES ($1, $2, $3, $4);
        `, [batchId, pr.rowNo, JSON.stringify(pr.raw), pr.errors.length > 0 ? JSON.stringify(pr.errors) : null]);
      }

      return {
        batchId,
        fileSha256,
        totalRows: rawRecords.length,
        validRows: validCount,
        invalidRows: invalidCount,
        duplicateRows: duplicateCount,
        previewRows: previewRows.slice(0, 100), // Return first 100 for display
      };
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 3. COMMIT BATCH (WITH STEP-UP)
  // ==========================================
  async commitBatch(batchId: string, societyId: string, adminId: string, baseUrl: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const batchRes = await client.query(`
        SELECT * FROM import_batch
        WHERE id = $1 AND society_id = $2;
      `, [batchId, societyId]);

      if (batchRes.rows.length === 0) throw new NotFoundException('Import batch not found');
      const batch = batchRes.rows[0];

      if (batch.status !== 'PREVIEW') {
        throw new BadRequestException(`Batch has already been ${batch.status.toLowerCase()}.`);
      }

      // Fetch preview rows that have no errors
      const rowsRes = await client.query(`
        SELECT * FROM import_row
        WHERE batch_id = $1 AND errors IS NULL
        ORDER BY row_no ASC;
      `, [batchId]);

      const committedSlips: any[] = [];
      const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      for (const row of rowsRes.rows) {
        const raw = row.raw;
        const wingName = (raw.wing || '').trim();
        const flatNumber = (raw.flat || '').trim();
        const role = (raw.role || 'RESIDENT').trim().toUpperCase();

        // 1. Get or create wing and flat
        let wingRes = await client.query(`SELECT id FROM wing WHERE society_id = $1 AND name = $2;`, [societyId, wingName]);
        if (wingRes.rows.length === 0) {
          wingRes = await client.query(`INSERT INTO wing (society_id, name) VALUES ($1, $2) RETURNING id;`, [societyId, wingName]);
        }
        const wingId = wingRes.rows[0].id;

        let flatRes = await client.query(`SELECT id FROM flat WHERE society_id = $1 AND wing_id = $2 AND flat_number = $3;`, [societyId, wingId, flatNumber]);
        const areaSqft = raw.area_sqft !== undefined && raw.area_sqft !== '' ? parseFloat(raw.area_sqft) : null;
        const flatType = raw.flat_type ? String(raw.flat_type).trim() : null;
        const parkingSlots = raw.parking_slots !== undefined && raw.parking_slots !== '' ? parseInt(raw.parking_slots, 10) : 0;
        const occupancy = raw.occupancy ? String(raw.occupancy).trim().toUpperCase() : 'OWNER_OCCUPIED';

        let flatId: string;
        if (flatRes.rows.length === 0) {
          const insertFlat = await client.query(`
            INSERT INTO flat (society_id, wing_id, flat_number, area_sqft, flat_type, parking_slots, occupancy)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
          `, [societyId, wingId, flatNumber, areaSqft, flatType, parkingSlots, occupancy]);
          flatId = insertFlat.rows[0].id;
        } else {
          flatId = flatRes.rows[0].id;
          if (areaSqft !== null || flatType !== null || (raw.parking_slots !== undefined && raw.parking_slots !== '') || raw.occupancy) {
            await client.query(`
              UPDATE flat SET
                area_sqft = COALESCE($1, area_sqft),
                flat_type = COALESCE($2, flat_type),
                parking_slots = COALESCE($3, parking_slots),
                occupancy = COALESCE($4, occupancy)
              WHERE id = $5;
            `, [areaSqft, flatType, raw.parking_slots !== undefined && raw.parking_slots !== '' ? parkingSlots : null, raw.occupancy ? occupancy : null, flatId]);
          }
        }

        const memberId = raw.member_id || `GV-${wingName}${flatNumber}-${Date.now().toString().slice(-4)}`;
        const username = `${raw.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${Date.now().toString().slice(-4)}`;

        // 2. Insert User in INVITED status
        const userRes = await client.query(`
          INSERT INTO app_user (
            society_id, flat_id, member_id, username, full_name, mobile, email,
            role, status, must_change_password
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INVITED', true)
          RETURNING id;
        `, [
          societyId,
          flatId,
          memberId,
          username,
          raw.full_name,
          raw.mobile,
          raw.email || null,
          role,
        ]);
        const createdUserId = userRes.rows[0].id;

        // 3. Generate 10-char activation code
        const code = generateActivationCode();
        const codeHash = sha256Hex(code);
        const verifyDetail = (raw.verify_detail || flatNumber).trim().toLowerCase();
        const verifyHash = sha256Hex(verifyDetail);

        await client.query(`
          INSERT INTO activation_code (
            user_id, code_hash, verify_detail_hash, expires_at, issued_by
          ) VALUES ($1, $2, $3, $4, $5);
        `, [createdUserId, codeHash, verifyHash, sevenDays, adminId]);

        // Link user to import_row
        await client.query(`UPDATE import_row SET created_user_id = $1 WHERE id = $2;`, [createdUserId, row.id]);

        // Build Slip object with QR code
        const activationUrl = `${baseUrl}/activate?user=${encodeURIComponent(username)}`;
        const qrCodeDataUrl = await QRCode.toDataURL(activationUrl);

        committedSlips.push({
          memberId,
          username,
          fullName: raw.full_name,
          role,
          wing: wingName,
          flat: flatNumber,
          code, // Shown ONLY ONCE in this response
          expiresAt: sevenDays.toISOString(),
          activationUrl,
          qrCode: qrCodeDataUrl,
        });
      }

      // Mark batch COMMITTED
      await client.query(`
        UPDATE import_batch
        SET status = 'COMMITTED', updated_at = NOW()
        WHERE id = $1;
      `, [batchId]);

      await this.auditService.append({
        societyId,
        actorId: adminId,
        actorRole: 'SUPER_ADMIN',
        action: 'IMPORT_COMMITTED',
        entityType: 'import_batch',
        entityId: batchId,
        after: { committedCount: committedSlips.length },
      });

      await client.query('COMMIT');

      return {
        success: true,
        committedCount: committedSlips.length,
        slips: committedSlips,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 4. ROLLBACK BATCH (WITHIN 7 DAYS)
  // ==========================================
  async rollbackBatch(batchId: string, societyId: string, adminId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const batchRes = await client.query(`
        SELECT * FROM import_batch WHERE id = $1 AND society_id = $2;
      `, [batchId, societyId]);

      if (batchRes.rows.length === 0) throw new NotFoundException('Batch not found');
      const batch = batchRes.rows[0];

      if (batch.status !== 'COMMITTED') {
        throw new BadRequestException(`Cannot rollback batch with status: ${batch.status}`);
      }

      // Check 7 days limit
      const ageHours = (Date.now() - new Date(batch.created_at).getTime()) / (1000 * 60 * 60);
      if (ageHours > 7 * 24) {
        throw new BadRequestException('Batch is older than 7 days and can no longer be rolled back.');
      }

      // Find created users that have NOT yet activated (status = 'INVITED')
      const createdUsersRes = await client.query(`
        SELECT r.created_user_id, u.status
        FROM import_row r
        JOIN app_user u ON r.created_user_id = u.id
        WHERE r.batch_id = $1 AND r.created_user_id IS NOT NULL;
      `, [batchId]);

      let removedCount = 0;
      for (const row of createdUsersRes.rows) {
        if (row.status === 'INVITED') {
          await client.query(`DELETE FROM app_user WHERE id = $1;`, [row.created_user_id]);
          removedCount++;
        }
      }

      await client.query(`
        UPDATE import_batch SET status = 'ROLLED_BACK', updated_at = NOW() WHERE id = $1;
      `, [batchId]);

      await this.auditService.append({
        societyId,
        actorId: adminId,
        actorRole: 'SUPER_ADMIN',
        action: 'IMPORT_ROLLED_BACK',
        entityType: 'import_batch',
        entityId: batchId,
        after: { removedInvitedUsers: removedCount },
      });

      await client.query('COMMIT');

      return {
        success: true,
        message: `Batch rolled back. ${removedCount} unactivated users removed.`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // 5. DOWNLOAD CREDENTIAL SLIPS (CSV WITH FORMULA ESCAPING)
  // ==========================================
  exportSlipsCsv(slips: any[]): string {
    const sanitize = (val: string) => {
      if (!val) return '';
      // Escape =, +, -, @ to prevent formula injection in Excel/Calc
      if (/^[=+\-@]/.test(val)) {
        return `'${val}`;
      }
      return val;
    };

    const headers = ['Member ID', 'Full Name', 'Role', 'Wing', 'Flat', 'Activation Code', 'Expires At', 'Activation URL'];
    const dataRows = slips.map((s) => [
      sanitize(s.memberId),
      sanitize(s.fullName),
      sanitize(s.role),
      sanitize(s.wing),
      sanitize(s.flat),
      sanitize(s.code),
      sanitize(s.expiresAt),
      sanitize(s.activationUrl),
    ]);

    return csvStringify.stringify([headers, ...dataRows]);
  }
}
