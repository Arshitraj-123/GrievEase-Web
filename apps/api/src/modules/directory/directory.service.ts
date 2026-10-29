import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import {
  DirectoryPreferenceDto,
  DirectoryMemberCardDto,
  OfficeBearerDto,
  EmergencyContactDto,
  CreateEmergencyContactDto,
  ServiceProviderDto,
  CreateServiceReviewDto,
} from '@grievease/contracts';

@Injectable()
export class DirectoryService {
  private readonly logger = new Logger(DirectoryService.name);
  // In-memory rate limiter for directory searches: userId -> { count, expiresAt }
  private searchRateLimitMap = new Map<string, { count: number; expiresAt: number }>();

  constructor(private auditService: AuditService) {}

  /**
   * Search member directory with anti-scraping safeguards:
   * - Requires >= 3 characters (rejects with 400 if shorter)
   * - Max 20 results per page
   * - Rate-limited: max 30 queries per 10 minutes per resident
   * - Strict opt-in: only users with visible = true appear
   * - Field-level privacy: only enabled fields are returned
   */
  async searchDirectory(
    societyId: string,
    userId: string,
    query: string,
    wingId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ results: DirectoryMemberCardDto[]; page: number; total: number }> {
    const trimmed = (query || '').trim();
    if (trimmed.length < 3) {
      throw new BadRequestException('Search query must be at least 3 characters.');
    }

    // Rate Limiting check: 30 queries per 10 minutes
    const now = Date.now();
    const rateWindowMs = 10 * 60 * 1000;
    const userLimit = this.searchRateLimitMap.get(userId);

    if (userLimit && userLimit.expiresAt > now) {
      if (userLimit.count >= 30) {
        this.logger.warn(`Anti-scraping: User ${userId} exceeded directory search rate limit.`);
        throw new ForbiddenException(
          'Directory search rate limit reached. Please wait before making more requests.'
        );
      }
      userLimit.count++;
    } else {
      this.searchRateLimitMap.set(userId, { count: 1, expiresAt: now + rateWindowMs });
    }

    const safeLimit = Math.min(Math.max(1, limit), 20);
    const offset = (Math.max(1, page) - 1) * safeLimit;

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let sql = `
        SELECT
          u.id,
          dp.show_name,
          dp.show_flat,
          dp.show_mobile,
          dp.show_email,
          dp.show_photo,
          dp.show_resident_type,
          u.full_name,
          w.name as wing_name,
          f.flat_number,
          u.mobile,
          u.email,
          u.role,
          u.resident_type
        FROM app_user u
        JOIN directory_preference dp ON u.id = dp.user_id
        LEFT JOIN flat f ON u.flat_id = f.id
        LEFT JOIN wing w ON f.wing_id = w.id
        WHERE u.society_id = $1
          AND u.status = 'ACTIVE'
          AND dp.visible = TRUE
          AND (
            (dp.show_name = TRUE AND u.full_name ILIKE $2) OR
            (dp.show_flat = TRUE AND f.flat_number ILIKE $2) OR
            (dp.show_flat = TRUE AND w.name ILIKE $2)
          )
      `;
      const params: any[] = [societyId, `%${trimmed}%`];

      if (wingId) {
        params.push(wingId);
        sql += ` AND f.wing_id = $${params.length}`;
      }

      sql += ` ORDER BY u.full_name ASC LIMIT ${safeLimit} OFFSET ${offset};`;

      const res = await client.query(sql, params);

      // Mask fields according to individual resident preferences
      const results: DirectoryMemberCardDto[] = res.rows.map((row) => ({
        id: row.id,
        fullName: row.show_name ? row.full_name : 'Resident',
        wingName: row.show_flat ? row.wing_name : null,
        flatNumber: row.show_flat ? row.flat_number : null,
        mobile: row.show_mobile ? row.mobile : null,
        email: row.show_email ? row.email : null,
        photoUrl: row.show_photo ? null : null,
        residentType: row.show_resident_type ? row.resident_type : null,
        role: row.role,
      }));

      return {
        results,
        page,
        total: results.length,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get resident's own directory privacy preference
   */
  async getDirectoryPreference(userId: string): Promise<DirectoryPreferenceDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        SELECT visible, show_name as "showName", show_flat as "showFlat",
               show_mobile as "showMobile", show_email as "showEmail",
               show_photo as "showPhoto", show_resident_type as "showResidentType"
        FROM directory_preference
        WHERE user_id = $1;
      `, [userId]);

      if (res.rows.length === 0) {
        // Return default: visible false, all false
        return {
          visible: false,
          showName: false,
          showFlat: false,
          showMobile: false,
          showEmail: false,
          showPhoto: false,
          showResidentType: false,
        };
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Update resident's own directory privacy preference
   */
  async updateDirectoryPreference(userId: string, dto: DirectoryPreferenceDto): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(`
        INSERT INTO directory_preference (
          user_id, visible, show_name, show_flat, show_mobile,
          show_email, show_photo, show_resident_type, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          visible = EXCLUDED.visible,
          show_name = EXCLUDED.show_name,
          show_flat = EXCLUDED.show_flat,
          show_mobile = EXCLUDED.show_mobile,
          show_email = EXCLUDED.show_email,
          show_photo = EXCLUDED.show_photo,
          show_resident_type = EXCLUDED.show_resident_type,
          updated_at = NOW();
      `, [
        userId,
        dto.visible,
        dto.showName,
        dto.showFlat,
        dto.showMobile,
        dto.showEmail,
        dto.showPhoto,
        dto.showResidentType,
      ]);

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * List managing committee office bearers
   */
  async getOfficeBearers(societyId: string): Promise<OfficeBearerDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        SELECT
          ob.id,
          ob.user_id as "userId",
          u.full_name as "fullName",
          ob.title,
          ob.display_order as "displayOrder",
          ob.public_to_residents as "publicToResidents",
          CASE WHEN dp.show_mobile THEN u.mobile ELSE NULL END as "mobile",
          CASE WHEN dp.show_email THEN u.email ELSE NULL END as "email"
        FROM office_bearer ob
        JOIN app_user u ON ob.user_id = u.id
        LEFT JOIN directory_preference dp ON u.id = dp.user_id
        WHERE ob.society_id = $1 AND ob.public_to_residents = TRUE
        ORDER BY ob.display_order ASC;
      `, [societyId]);

      return res.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Emergency Contacts (tap to call, cached offline in service worker)
   */
  async getEmergencyContacts(societyId: string): Promise<EmergencyContactDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Seed default emergency contacts if none exist
      const countRes = await client.query(`
        SELECT COUNT(*)::int as count FROM emergency_contact WHERE society_id = $1;
      `, [societyId]);

      if (countRes.rows[0].count === 0) {
        const defaults = [
          { name: 'Security Main Gate', cat: 'security', phone: '020-2740001', sort: 1 },
          { name: 'City Police Control Room', cat: 'police', phone: '100', sort: 2 },
          { name: 'Ambulance & Emergency Medical', cat: 'ambulance', phone: '108', sort: 3 },
          { name: 'Fire Station Brigade', cat: 'fire', phone: '101', sort: 4 },
          { name: 'MSEDCL Electricity Emergency', cat: 'electricity_board', phone: '1912', sort: 5 },
          { name: 'Municipal Water Supply Helpline', cat: 'water_board', phone: '020-25501000', sort: 6 },
          { name: 'Schindler 24/7 Lift Helpline', cat: 'lift_service', phone: '1800-209-5438', sort: 7 },
        ];
        for (const d of defaults) {
          await client.query(`
            INSERT INTO emergency_contact (society_id, name, category, phone, sort_order)
            VALUES ($1, $2, $3, $4, $5);
          `, [societyId, d.name, d.cat, d.phone, d.sort]);
        }
      }

      const res = await client.query(`
        SELECT id, name, category, phone, notes, sort_order as "sortOrder"
        FROM emergency_contact
        WHERE society_id = $1
        ORDER BY sort_order ASC, name ASC;
      `, [societyId]);

      return res.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Admin create emergency contact
   */
  async createEmergencyContact(
    societyId: string,
    userId: string,
    dto: CreateEmergencyContactDto
  ): Promise<{ id: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        INSERT INTO emergency_contact (society_id, name, category, phone, notes, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `, [societyId, dto.name.trim(), dto.category, dto.phone.trim(), dto.notes?.trim() || null, dto.sortOrder || 0]);

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'EMERGENCY_CONTACT_CREATED',
        entityType: 'EMERGENCY_CONTACT',
        entityId: res.rows[0].id,
        after: { name: dto.name, category: dto.category },
      });

      return { id: res.rows[0].id };
    } finally {
      client.release();
    }
  }

  /**
   * List approved service providers with rating averages (stars shown only when N >= 3)
   */
  async getServiceProviders(societyId: string, category?: string): Promise<ServiceProviderDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let sql = `
        SELECT
          sp.id,
          sp.name,
          sp.category,
          sp.phone,
          sp.area,
          sp.notes,
          sp.is_approved as "isApproved",
          COUNT(spr.id)::int as "reviewCount",
          AVG(spr.stars)::numeric(2,1) as "avgStars"
        FROM service_provider sp
        LEFT JOIN service_provider_review spr ON sp.id = spr.provider_id AND spr.is_hidden = FALSE
        WHERE sp.society_id = $1 AND sp.is_approved = TRUE
      `;
      const params: any[] = [societyId];

      if (category) {
        params.push(category);
        sql += ` AND sp.category ILIKE $${params.length}`;
      }

      sql += ` GROUP BY sp.id ORDER BY sp.name ASC;`;

      const res = await client.query(sql, params);

      return res.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        phone: row.phone,
        area: row.area,
        notes: row.notes,
        isApproved: row.isApproved,
        reviewCount: row.reviewCount,
        // N >= 3 rule: show stars only when at least 3 reviews exist
        avgStars: row.reviewCount >= 3 ? parseFloat(row.avgStars) : null,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Submit service provider review
   */
  async submitServiceReview(
    userId: string,
    providerId: string,
    dto: CreateServiceReviewDto
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(`
        INSERT INTO service_provider_review (provider_id, user_id, stars, comment, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (provider_id, user_id) DO UPDATE SET
          stars = EXCLUDED.stars,
          comment = EXCLUDED.comment,
          updated_at = NOW();
      `, [providerId, userId, dto.stars, dto.comment?.trim() || null]);

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Admin moderate review (hide abusive review, audited)
   */
  async moderateReview(
    societyId: string,
    userId: string,
    reviewId: string,
    hide: boolean,
    reason: string
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(`
        UPDATE service_provider_review
        SET is_hidden = $1, updated_at = NOW()
        WHERE id = $2;
      `, [hide, reviewId]);

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: hide ? 'REVIEW_HIDDEN_MODERATED' : 'REVIEW_UNHIDDEN',
        entityType: 'SERVICE_PROVIDER_REVIEW',
        entityId: reviewId,
        after: { isHidden: hide, reason },
      });

      return true;
    } finally {
      client.release();
    }
  }
}
