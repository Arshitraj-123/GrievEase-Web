import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import crypto from 'crypto';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  formatPaise,
  amountInWords,
  financialYearLabel,
  formatReceiptNo,
  formatBillNo,
  roundHalfUp,
  multiplyPaise,
  perSqft,
  applyPercent,
} from '@grievease/contracts';

@Injectable()
export class BillingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingService.name);
  private lateFeeTimer: NodeJS.Timeout | null = null;

  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private gateway: NotificationsGateway,
  ) {}

  async onModuleInit() {
    // Nightly late fee calculation sweep (every 24 hours)
    this.lateFeeTimer = setInterval(
      () => this.runNightlyLateFeeSweep().catch((e) => this.logger.error(`Late fee sweep error: ${e.message}`)),
      24 * 60 * 60 * 1000,
    );
  }

  async onModuleDestroy() {
    if (this.lateFeeTimer) clearInterval(this.lateFeeTimer);
  }

  // ─── Separation of Duties & Maker-Checker Helper ─────────────────────────────

  /**
   * Enforce Maker-Checker rule:
   * The creator of a financial commit/request can NEVER approve it themselves.
   * If the society has < 2 eligible approvers, Super Admin can approve with SOLE_APPROVER flag.
   */
  async verifyMakerChecker(
    client: any,
    societyId: string,
    actorId: string,
    creatorId: string,
    actionName: string,
  ): Promise<{ isSoleApprover: boolean }> {
    if (actorId === creatorId) {
      // Check if society has < 2 eligible approvers and actor is SUPER_ADMIN
      const approverCountRes = await client.query(
        `SELECT COUNT(DISTINCT id) AS cnt FROM app_user
         WHERE society_id = $1 AND role IN ('SUPER_ADMIN', 'CHAIRMAN', 'COMMITTEE') AND status = 'ACTIVE'`,
        [societyId],
      );
      const eligibleCount = Number(approverCountRes.rows[0]?.cnt || 0);

      const userRes = await client.query(`SELECT role FROM app_user WHERE id = $1`, [actorId]);
      const actorRole = userRes.rows[0]?.role;

      if (eligibleCount < 2 && actorRole === 'SUPER_ADMIN') {
        // Allow with SOLE_APPROVER flag and notify all Governing Body members
        await this.notificationsService.send({
          societyId,
          targetRole: 'GOVERNING_BODY',
          title: `⚠️ Maker-Checker Sole Approval: ${actionName}`,
          message: `Super Admin self-approved ${actionName} as the society has fewer than two eligible approvers.`,
          type: 'WARNING',
        });
        return { isSoleApprover: true };
      }

      throw new ForbiddenException(
        `Maker-Checker violation: You created this request and cannot approve it yourself. A second eligible approver must review and approve it.`,
      );
    }
    return { isSoleApprover: false };
  }

  // ─── Bill Heads ──────────────────────────────────────────────────────────────

  async listHeads(societyId: string, lang: string = 'en') {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT id, calc_method, rate_paise, rate_table, tax_percent, active, sort,
                CASE $2 WHEN 'hi' THEN name_hi WHEN 'mr' THEN name_mr ELSE name_en END AS name,
                name_en, name_hi, name_mr
         FROM bill_head
         WHERE society_id = $1
         ORDER BY sort ASC, created_at ASC`,
        [societyId, lang],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createHead(societyId: string, actorId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `INSERT INTO bill_head (
           society_id, name_en, name_hi, name_mr, calc_method, rate_paise, rate_table, tax_percent, active, sort
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          societyId,
          dto.nameEn,
          dto.nameHi,
          dto.nameMr,
          dto.calcMethod,
          dto.ratePaise || 0,
          dto.rateTable ? JSON.stringify(dto.rateTable) : null,
          dto.taxPercent || 0,
          dto.active !== false,
          dto.sort || 0,
        ],
      );
      const headId = res.rows[0].id;
      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'ADMIN',
        action: 'BILL_HEAD_CREATED',
        entityType: 'BILL_HEAD',
        entityId: headId,
        after: { nameEn: dto.nameEn, calcMethod: dto.calcMethod },
      });
      return { id: headId };
    } finally {
      client.release();
    }
  }

  async updateHead(societyId: string, actorId: string, headId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query(
        `UPDATE bill_head SET
           name_en = $3, name_hi = $4, name_mr = $5,
           calc_method = $6, rate_paise = $7, rate_table = $8,
           tax_percent = $9, active = $10, sort = $11, updated_at = NOW()
         WHERE id = $1 AND society_id = $2`,
        [
          headId,
          societyId,
          dto.nameEn,
          dto.nameHi,
          dto.nameMr,
          dto.calcMethod,
          dto.ratePaise || 0,
          dto.rateTable ? JSON.stringify(dto.rateTable) : null,
          dto.taxPercent || 0,
          dto.active !== false,
          dto.sort || 0,
        ],
      );
      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'ADMIN',
        action: 'BILL_HEAD_UPDATED',
        entityType: 'BILL_HEAD',
        entityId: headId,
        after: dto,
      });
      return { success: true };
    } finally {
      client.release();
    }
  }

  // ─── Bill Cycle & Generation ─────────────────────────────────────────────────

  async listCycles(societyId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT c.*,
                u1.full_name AS generated_by_name,
                u2.full_name AS approved_by_name,
                COUNT(b.id) AS bills_count,
                COALESCE(SUM(b.total_paise), 0) AS total_billed_paise
         FROM bill_cycle c
         LEFT JOIN app_user u1 ON c.generated_by = u1.id
         LEFT JOIN app_user u2 ON c.approved_by = u2.id
         LEFT JOIN bill b ON c.id = b.cycle_id
         WHERE c.society_id = $1
         GROUP BY c.id, u1.full_name, u2.full_name
         ORDER BY c.period_start DESC`,
        [societyId],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async previewCycle(societyId: string, actorId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check for duplicate cycle for this period
      const dupRes = await client.query(
        `SELECT id, status FROM bill_cycle WHERE society_id = $1 AND period_start = $2`,
        [societyId, dto.periodStart],
      );
      if (dupRes.rows.length > 0 && dupRes.rows[0].status === 'ISSUED') {
        throw new BadRequestException('A bill cycle for this period has already been issued.');
      }

      // Fetch requested heads
      const headsRes = await client.query(
        `SELECT * FROM bill_head WHERE society_id = $1 AND id = ANY($2::uuid[]) AND active = TRUE ORDER BY sort`,
        [societyId, dto.headIds],
      );
      const heads = headsRes.rows;

      // Fetch all flats with wing info
      const flatsRes = await client.query(
        `SELECT f.id, f.flat_number, f.area_sqft, f.flat_type, f.parking_slots, f.occupancy,
                w.name AS wing_name
         FROM flat f
         JOIN wing w ON f.wing_id = w.id
         WHERE f.society_id = $1
         ORDER BY w.name, f.flat_number`,
        [societyId],
      );
      const flats = flatsRes.rows;

      const previewRows: any[] = [];
      let totalSubtotalPaise = 0;
      let totalTaxPaise = 0;
      let totalBilledPaise = 0;
      const missingDataFlats: any[] = [];
      const zeroBills: any[] = [];
      const headSums: Record<string, number> = {};

      for (const h of heads) {
        headSums[h.id] = 0;
      }

      for (const f of flats) {
        let flatSubtotal = 0;
        let flatTax = 0;
        const lineItems: any[] = [];

        for (const h of heads) {
          let lineAmount = 0;
          let qty = 1;
          let rate = Number(h.rate_paise);

          if (h.calc_method === 'FIXED_PER_FLAT') {
            lineAmount = rate;
          } else if (h.calc_method === 'PER_SQFT') {
            const sqft = Number(f.area_sqft || 0);
            if (sqft <= 0) {
              missingDataFlats.push({
                flatId: f.id,
                flatNumber: `${f.wing_name}-${f.flat_number}`,
                reason: 'Missing area_sqft for PER_SQFT calculation',
              });
            }
            qty = sqft;
            lineAmount = perSqft(rate, sqft);
          } else if (h.calc_method === 'BY_FLAT_TYPE') {
            const type = f.flat_type || 'STANDARD';
            const rateFromTable = h.rate_table ? h.rate_table[type] : null;
            if (rateFromTable === undefined || rateFromTable === null) {
              missingDataFlats.push({
                flatId: f.id,
                flatNumber: `${f.wing_name}-${f.flat_number}`,
                reason: `No rate configured for flat type '${type}'`,
              });
              lineAmount = rate;
            } else {
              rate = Number(rateFromTable);
              lineAmount = rate;
            }
          } else if (h.calc_method === 'PER_PARKING_SLOT') {
            qty = f.parking_slots || 0;
            lineAmount = multiplyPaise(rate, qty);
          } else {
            // MANUAL
            lineAmount = rate;
          }

          const taxPercent = Number(h.tax_percent || 0);
          const lineTax = applyPercent(lineAmount, taxPercent);

          flatSubtotal += lineAmount;
          flatTax += lineTax;
          headSums[h.id] = (headSums[h.id] || 0) + lineAmount;

          lineItems.push({
            headId: h.id,
            headName: h.name_en,
            qty,
            ratePaise: rate,
            amountPaise: lineAmount,
            taxPercent,
            taxPaise: lineTax,
          });
        }

        const flatTotal = flatSubtotal + flatTax;
        totalSubtotalPaise += flatSubtotal;
        totalTaxPaise += flatTax;
        totalBilledPaise += flatTotal;

        if (flatTotal === 0) {
          zeroBills.push(`${f.wing_name}-${f.flat_number}`);
        }

        previewRows.push({
          flatId: f.id,
          flatNumber: f.flat_number,
          wingName: f.wing_name,
          occupancy: f.occupancy,
          subtotalPaise: flatSubtotal,
          taxPaise: flatTax,
          totalPaise: flatTotal,
          lines: lineItems,
        });
      }

      // Save or update cycle in PREVIEWED status
      let cycleId: string;
      if (dupRes.rows.length > 0) {
        cycleId = dupRes.rows[0].id;
        await client.query(
          `UPDATE bill_cycle SET
             name = $3, period_end = $4, due_date = $5, head_ids = $6,
             status = 'PREVIEWED', generated_by = $7, updated_at = NOW()
           WHERE id = $1`,
          [cycleId, societyId, dto.name, dto.periodEnd, dto.dueDate, dto.headIds, actorId],
        );
      } else {
        const insertRes = await client.query(
          `INSERT INTO bill_cycle (
             society_id, name, period_start, period_end, due_date, status, generated_by, head_ids
           ) VALUES ($1, $2, $3, $4, $5, 'PREVIEWED', $6, $7)
           RETURNING id`,
          [societyId, dto.name, dto.periodStart, dto.periodEnd, dto.dueDate, actorId, dto.headIds],
        );
        cycleId = insertRes.rows[0].id;
      }

      return {
        cycleId,
        totals: {
          flatsCount: flats.length,
          subtotalPaise: totalSubtotalPaise,
          taxPaise: totalTaxPaise,
          totalBilledPaise,
        },
        headSums: Object.entries(headSums).map(([id, amount]) => {
          const head = heads.find((h) => h.id === id);
          return { headId: id, name: head?.name_en || '', amountPaise: amount };
        }),
        missingDataFlats,
        zeroBillsCount: zeroBills.length,
        previewRows: previewRows.slice(0, 100),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Commit bill generation: Maker-checker strictly enforced.
   * Runs atomically, allocates gapless bill numbers from locked counter,
   * writes bill + bill_line rows, posts BILL debit entries to ledger, and dispatches in-app notifications.
   */
  async commitCycle(societyId: string, actorId: string, cycleId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const cycleRes = await client.query(
        `SELECT * FROM bill_cycle WHERE id = $1 AND society_id = $2 FOR UPDATE`,
        [cycleId, societyId],
      );
      if (cycleRes.rows.length === 0) throw new NotFoundException('Bill cycle not found');
      const cycle = cycleRes.rows[0];

      if (cycle.status === 'ISSUED') {
        throw new BadRequestException('This bill cycle has already been issued.');
      }

      // Maker-Checker verification
      await this.verifyMakerChecker(
        client,
        societyId,
        actorId,
        cycle.generated_by,
        `Bill Generation for cycle "${cycle.name}"`,
      );

      // Financial year label
      const fyLabel = financialYearLabel(new Date(cycle.period_start));

      // Lock bill_number_counter row for gapless sequential numbers
      await client.query(
        `INSERT INTO bill_number_counter (society_id, fy_label, last_seq)
         VALUES ($1, $2, 0)
         ON CONFLICT (society_id, fy_label) DO NOTHING`,
        [societyId, fyLabel],
      );
      const counterRes = await client.query(
        `SELECT last_seq FROM bill_number_counter
         WHERE society_id = $1 AND fy_label = $2
         FOR UPDATE`,
        [societyId, fyLabel],
      );
      let currentSeq = Number(counterRes.rows[0]?.last_seq || 0);

      // Fetch heads
      const headsRes = await client.query(
        `SELECT * FROM bill_head WHERE society_id = $1 AND id = ANY($2::uuid[]) ORDER BY sort`,
        [societyId, cycle.head_ids],
      );
      const heads = headsRes.rows;

      // Fetch flats
      const flatsRes = await client.query(
        `SELECT f.id, f.flat_number, f.area_sqft, f.flat_type, f.parking_slots, f.occupancy,
                w.name AS wing_name
         FROM flat f
         JOIN wing w ON f.wing_id = w.id
         WHERE f.society_id = $1
         ORDER BY w.name, f.flat_number`,
        [societyId],
      );
      const flats = flatsRes.rows;

      const generatedBills: any[] = [];

      for (const f of flats) {
        currentSeq++;
        const billNo = formatBillNo(currentSeq, fyLabel);

        let flatSubtotal = 0;
        let flatTax = 0;
        const lineData: any[] = [];

        for (const h of heads) {
          let lineAmount = 0;
          let qty = 1;
          let rate = Number(h.rate_paise);

          if (h.calc_method === 'FIXED_PER_FLAT') {
            lineAmount = rate;
          } else if (h.calc_method === 'PER_SQFT') {
            const sqft = Number(f.area_sqft || 0);
            qty = sqft;
            lineAmount = perSqft(rate, sqft);
          } else if (h.calc_method === 'BY_FLAT_TYPE') {
            const type = f.flat_type || 'STANDARD';
            rate = h.rate_table && h.rate_table[type] !== undefined ? Number(h.rate_table[type]) : rate;
            lineAmount = rate;
          } else if (h.calc_method === 'PER_PARKING_SLOT') {
            qty = f.parking_slots || 0;
            lineAmount = multiplyPaise(rate, qty);
          } else {
            lineAmount = rate;
          }

          const taxPercent = Number(h.tax_percent || 0);
          const lineTax = applyPercent(lineAmount, taxPercent);

          flatSubtotal += lineAmount;
          flatTax += lineTax;

          lineData.push({
            headId: h.id,
            description: `${h.name_en} (${cycle.name})`,
            qty,
            ratePaise: rate,
            amountPaise: lineAmount,
            taxPercent,
            taxPaise: lineTax,
          });
        }

        const flatTotal = flatSubtotal + flatTax;

        // Insert bill
        const billRes = await client.query(
          `INSERT INTO bill (
             society_id, flat_id, cycle_id, bill_no, subtotal_paise, tax_paise, adjustments_paise,
             total_paise, status, due_date
           ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 'ISSUED', $8)
           RETURNING id`,
          [societyId, f.id, cycleId, billNo, flatSubtotal, flatTax, flatTotal, cycle.due_date],
        );
        const billId = billRes.rows[0].id;

        // Insert bill lines
        for (const ld of lineData) {
          await client.query(
            `INSERT INTO bill_line (
               bill_id, head_id, description, qty, rate_paise, amount_paise, tax_percent, tax_paise
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [billId, ld.headId, ld.description, ld.qty, ld.ratePaise, ld.amountPaise, ld.taxPercent, ld.taxPaise],
          );
        }

        // Post BILL DEBIT to flat ledger
        await this.postLedgerEntryInternal(client, {
          societyId,
          flatId: f.id,
          entryType: 'BILL',
          direction: 'DEBIT',
          amountPaise: flatTotal,
          refType: 'bill',
          refId: billId,
          narration: `Maintenance bill ${billNo} for ${cycle.name} (Due: ${new Date(cycle.due_date).toLocaleDateString()})`,
          createdBy: actorId,
        });

        generatedBills.push({ billId, flatId: f.id, billNo, totalPaise: flatTotal });
      }

      // Update bill_number_counter
      await client.query(
        `UPDATE bill_number_counter SET last_seq = $3 WHERE society_id = $1 AND fy_label = $2`,
        [societyId, fyLabel, currentSeq],
      );

      // Update cycle status to ISSUED
      await client.query(
        `UPDATE bill_cycle SET status = 'ISSUED', approved_by = $3, issued_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND society_id = $2`,
        [cycleId, societyId, actorId],
      );

      // Batch resident in-app notifications
      const userRes = await client.query(
        `SELECT id, flat_id FROM app_user WHERE society_id = $1 AND role = 'RESIDENT' AND flat_id IS NOT NULL`,
        [societyId],
      );
      for (const u of userRes.rows) {
        await this.notificationsService.send({
          societyId,
          userId: u.id,
          title: `📄 Maintenance Bill Issued (${cycle.name})`,
          message: `Your maintenance bill for ${cycle.name} has been issued. Due date: ${new Date(cycle.due_date).toLocaleDateString()}. View bill in the app.`,
          type: 'INFO',
          link: '/app/bills',
        });
      }

      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'ADMIN',
        action: 'BILL_CYCLE_COMMITTED',
        entityType: 'BILL_CYCLE',
        entityId: cycleId,
        after: {
          cycleName: cycle.name,
          billsGenerated: generatedBills.length,
          lastBillNo: generatedBills[generatedBills.length - 1]?.billNo,
        },
      });

      await client.query('COMMIT');
      return { success: true, count: generatedBills.length, lastBillNo: generatedBills[generatedBills.length - 1]?.billNo };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Opening Balances Import ──────────────────────────────────────────────────

  async previewOpeningBalances(societyId: string, _actorId: string, rows: any[]) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const previewRows: any[] = [];
      let totalAmountPaise = 0;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const flatSearch = (r.flat || r.member_id || '').trim();
        const amountPaise = Number(r.amount_paise || roundHalfUp(Number(r.amount || 0) * 100));

        // Find flat
        const flatRes = await client.query(
          `SELECT f.id, f.flat_number, w.name AS wing_name
           FROM flat f
           JOIN wing w ON f.wing_id = w.id
           WHERE f.society_id = $1 AND (f.flat_number = $2 OR f.id::text = $2)`,
          [societyId, flatSearch],
        );

        const flatFound = flatRes.rows.length > 0;
        const flat = flatRes.rows[0];

        totalAmountPaise += amountPaise;

        previewRows.push({
          rowNo: i + 1,
          input: flatSearch,
          flatId: flat?.id || null,
          flatDisplay: flatFound ? `${flat.wing_name}-${flat.flat_number}` : 'NOT FOUND',
          amountPaise,
          asOfDate: r.as_of_date || new Date().toISOString().split('T')[0],
          note: r.note || 'Opening balance',
          valid: flatFound && amountPaise > 0,
        });
      }

      return {
        totalRows: rows.length,
        validRows: previewRows.filter((p) => p.valid).length,
        totalAmountPaise,
        previewRows,
      };
    } finally {
      client.release();
    }
  }

  async commitOpeningBalances(
    societyId: string,
    actorId: string,
    items: { flatId: string; amountPaise: number; asOfDate: string; note: string }[],
    creatorId: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Maker-checker
      await this.verifyMakerChecker(client, societyId, actorId, creatorId, 'Opening Balances Commit');

      for (const item of items) {
        await this.postLedgerEntryInternal(client, {
          societyId,
          flatId: item.flatId,
          entryType: 'OPENING_BALANCE',
          direction: 'DEBIT',
          amountPaise: item.amountPaise,
          refType: 'opening_balance',
          refId: item.flatId,
          narration: `Opening balance as of ${item.asOfDate}: ${item.note}`,
          createdBy: actorId,
        });
      }

      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'ADMIN',
        action: 'OPENING_BALANCES_COMMITTED',
        entityType: 'LEDGER',
        after: { itemsCount: items.length },
      });

      await client.query('COMMIT');
      return { success: true, count: items.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Cash Collection Desk ─────────────────────────────────────────────────────

  /**
   * Record a cash payment from a resident at the society office.
   * Prerequisites:
   * 1. Collector must have an OPEN cash_session.
   * 2. Transaction allocates a gapless receipt number from locked receipt_counter.
   * 3. Writes payment + allocations + CREDIT ledger entry + audit log.
   * 4. Updates bill statuses.
   * 5. Dispatches live in-app notification to flat members.
   * 6. Emits Socket.io event.
   */
  async recordPayment(
    societyId: string,
    collectorId: string,
    dto: {
      flatId: string;
      amountPaise: number;
      receivedOn: string;
      receivedFromName: string;
      mode?: string;
      allocationStrategy?: 'OLDEST_FIRST' | 'SPECIFIC_BILL' | 'ADVANCE';
      specificBillId?: string;
      note?: string;
      idempotencyKey: string;
    },
    ip?: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Verify collector has an OPEN cash session
      const sessionRes = await client.query(
        `SELECT id FROM cash_session
         WHERE society_id = $1 AND collector_id = $2 AND status = 'OPEN'`,
        [societyId, collectorId],
      );
      if (sessionRes.rows.length === 0) {
        throw new BadRequestException(
          'You must open a cash session before recording cash collections. Go to Day Close to open today’s session.',
        );
      }
      const sessionId = sessionRes.rows[0].id;

      // 2. Idempotency check
      const idempRes = await client.query(
        `SELECT id, receipt_no FROM payment
         WHERE society_id = $1 AND idempotency_key = $2 AND status = 'RECORDED'`,
        [societyId, dto.idempotencyKey],
      );
      if (idempRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return { paymentId: idempRes.rows[0].id, receiptNo: idempRes.rows[0].receipt_no, isDuplicate: true };
      }

      // 3. Duplicate warning (< 10 min same flat & amount)
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const dupCheck = await client.query(
        `SELECT id, receipt_no, created_at FROM payment
         WHERE society_id = $1 AND flat_id = $2 AND amount_paise = $3
           AND status = 'RECORDED' AND created_at > $4`,
        [societyId, dto.flatId, dto.amountPaise, tenMinAgo],
      );
      if (dupCheck.rows.length > 0 && !dto.note?.includes('[CONFIRMED_DUPLICATE]')) {
        throw new BadRequestException(
          `Duplicate payment warning: An identical amount of ${formatPaise(dto.amountPaise)} was recorded for this flat ${new Date(dupCheck.rows[0].created_at).toLocaleTimeString()} (Receipt ${dupCheck.rows[0].receipt_no}). Add "[CONFIRMED_DUPLICATE]" to the note to proceed.`,
        );
      }

      // 4. Lock receipt_counter row and allocate gapless number
      const receivedDate = new Date(dto.receivedOn);
      const fyLabel = financialYearLabel(receivedDate);

      // Fetch prefix setting
      const prefixRes = await client.query(
        `SELECT setting_value FROM society_setting WHERE society_id = $1 AND setting_key = 'receipt_prefix'`,
        [societyId],
      );
      const prefix = prefixRes.rows[0]?.setting_value || 'RC';

      await client.query(
        `INSERT INTO receipt_counter (society_id, fy_label, last_seq)
         VALUES ($1, $2, 0)
         ON CONFLICT (society_id, fy_label) DO NOTHING`,
        [societyId, fyLabel],
      );
      const counterRes = await client.query(
        `SELECT last_seq FROM receipt_counter
         WHERE society_id = $1 AND fy_label = $2
         FOR UPDATE`,
        [societyId, fyLabel],
      );
      const nextSeq = Number(counterRes.rows[0]?.last_seq || 0) + 1;
      const receiptNo = formatReceiptNo(nextSeq, fyLabel, prefix);

      await client.query(
        `UPDATE receipt_counter SET last_seq = $3 WHERE society_id = $1 AND fy_label = $2`,
        [societyId, fyLabel, nextSeq],
      );

      // 5. Insert payment row
      const paymentRes = await client.query(
        `INSERT INTO payment (
           society_id, flat_id, receipt_no, mode, amount_paise, received_on, received_by,
           received_from_name, allocation_strategy, note, status, session_id, session_id_fk, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RECORDED', $11, $11, $12)
         RETURNING id`,
        [
          societyId,
          dto.flatId,
          receiptNo,
          dto.mode || 'CASH',
          dto.amountPaise,
          dto.receivedOn,
          collectorId,
          dto.receivedFromName,
          dto.allocationStrategy || 'OLDEST_FIRST',
          dto.note || null,
          sessionId,
          dto.idempotencyKey,
        ],
      );
      const paymentId = paymentRes.rows[0].id;

      // 6. Perform Allocation
      let remainingToAllocate = dto.amountPaise;
      const allocations: { billId: string | null; amountPaise: number; kind: string }[] = [];

      if (dto.allocationStrategy === 'SPECIFIC_BILL' && dto.specificBillId) {
        const billRes = await client.query(
          `SELECT id, total_paise FROM bill WHERE id = $1 AND society_id = $2 FOR UPDATE`,
          [dto.specificBillId, societyId],
        );
        if (billRes.rows.length > 0) {
          const b = billRes.rows[0];
          // Find already paid amount
          const paidRes = await client.query(
            `SELECT COALESCE(SUM(amount_paise), 0) AS paid FROM payment_allocation WHERE bill_id = $1`,
            [b.id],
          );
          const alreadyPaid = Number(paidRes.rows[0]?.paid || 0);
          const dueOnBill = Math.max(0, Number(b.total_paise) - alreadyPaid);
          const allocAmount = Math.min(remainingToAllocate, dueOnBill);

          if (allocAmount > 0) {
            allocations.push({ billId: b.id, amountPaise: allocAmount, kind: 'BILL' });
            remainingToAllocate -= allocAmount;
            const newTotalPaid = alreadyPaid + allocAmount;
            const newStatus = newTotalPaid >= Number(b.total_paise) ? 'PAID' : 'PARTIALLY_PAID';
            await client.query(`UPDATE bill SET status = $2, updated_at = NOW() WHERE id = $1`, [b.id, newStatus]);
          }
        }
      } else if (dto.allocationStrategy !== 'ADVANCE') {
        // OLDEST_FIRST: find unpaid bills ordered by due_date ASC
        const billsRes = await client.query(
          `SELECT b.id, b.total_paise,
                  COALESCE((SELECT SUM(pa.amount_paise) FROM payment_allocation pa WHERE pa.bill_id = b.id), 0) AS paid_paise
           FROM bill b
           WHERE b.society_id = $1 AND b.flat_id = $2 AND b.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
           ORDER BY b.due_date ASC, b.created_at ASC
           FOR UPDATE`,
          [societyId, dto.flatId],
        );

        for (const b of billsRes.rows) {
          if (remainingToAllocate <= 0) break;
          const due = Math.max(0, Number(b.total_paise) - Number(b.paid_paise));
          if (due <= 0) continue;
          const allocAmount = Math.min(remainingToAllocate, due);
          allocations.push({ billId: b.id, amountPaise: allocAmount, kind: 'BILL' });
          remainingToAllocate -= allocAmount;

          const newTotalPaid = Number(b.paid_paise) + allocAmount;
          const newStatus = newTotalPaid >= Number(b.total_paise) ? 'PAID' : 'PARTIALLY_PAID';
          await client.query(`UPDATE bill SET status = $2, updated_at = NOW() WHERE id = $1`, [b.id, newStatus]);
        }
      }

      // Any remaining amount is ADVANCE
      if (remainingToAllocate > 0) {
        allocations.push({ billId: null, amountPaise: remainingToAllocate, kind: 'ADVANCE' });
      }

      // Insert allocation records
      for (const a of allocations) {
        await client.query(
          `INSERT INTO payment_allocation (payment_id, bill_id, amount_paise, kind)
           VALUES ($1, $2, $3, $4)`,
          [paymentId, a.billId, a.amountPaise, a.kind],
        );
      }

      // 7. Post CREDIT ledger entry
      await this.postLedgerEntryInternal(client, {
        societyId,
        flatId: dto.flatId,
        entryType: 'PAYMENT',
        direction: 'CREDIT',
        amountPaise: dto.amountPaise,
        refType: 'payment',
        refId: paymentId,
        narration: `Payment received (Receipt ${receiptNo}): ${formatPaise(dto.amountPaise)} via ${dto.mode || 'CASH'}. Received from: ${dto.receivedFromName}`,
        createdBy: collectorId,
      });

      // 8. Audit trail
      await this.auditService.append({
        societyId,
        actorId: collectorId,
        actorRole: 'SECRETARY',
        action: 'PAYMENT_RECORDED',
        entityType: 'PAYMENT',
        entityId: paymentId,
        after: {
          receiptNo,
          amountPaise: dto.amountPaise,
          flatId: dto.flatId,
          allocationsCount: allocations.length,
        },
        ip,
      });

      // 9. Fetch collector details for live notification
      const collectorRes = await client.query(
        `SELECT u.full_name, u.role FROM app_user u WHERE u.id = $1`,
        [collectorId],
      );
      const collectorName = collectorRes.rows[0]?.full_name || 'Society Collector';
      const collectorRole = collectorRes.rows[0]?.role || 'SECRETARY';

      // 10. Live in-app notification to all members of this flat
      const residentRes = await client.query(
        `SELECT id FROM app_user WHERE society_id = $1 AND flat_id = $2 AND role = 'RESIDENT'`,
        [societyId, dto.flatId],
      );
      for (const r of residentRes.rows) {
        await this.notificationsService.send({
          societyId,
          userId: r.id,
          title: `💵 Payment Recorded: ${formatPaise(dto.amountPaise)}`,
          message: `Payment of ${formatPaise(dto.amountPaise)} recorded by ${collectorName} (${collectorRole}) on ${dto.receivedOn}, receipt no. ${receiptNo}.`,
          type: 'SUCCESS',
          link: `/app/payments/${paymentId}`,
        });
      }

      // 11. Socket.io event for live statement updates
      this.gateway.emitToSociety(societyId, 'billing.payment_recorded', {
        flatId: dto.flatId,
        receiptNo,
        amountPaise: dto.amountPaise,
      });

      await client.query('COMMIT');
      return { paymentId, receiptNo, status: 'RECORDED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Receipts & Verification ──────────────────────────────────────────────────

  async getReceipt(societyId: string, paymentId: string, requestingUserId: string, isAdmin: boolean = false) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT p.*,
                f.flat_number, w.name AS wing_name,
                u.full_name AS collector_name, u.role AS collector_role,
                s.name AS society_name, s.address AS society_address
         FROM payment p
         JOIN flat f ON p.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         JOIN app_user u ON p.received_by = u.id
         JOIN society s ON p.society_id = s.id
         WHERE p.id = $1 AND p.society_id = $2`,
        [paymentId, societyId],
      );
      if (res.rows.length === 0) throw new NotFoundException('Receipt not found');
      const p = res.rows[0];

      // IDOR check: resident can only see their own flat's receipts
      if (!isAdmin) {
        const userRes = await client.query(`SELECT flat_id FROM app_user WHERE id = $1`, [requestingUserId]);
        if (userRes.rows[0]?.flat_id !== p.flat_id) {
          throw new ForbiddenException('Access denied: You can only view receipts for your own flat.');
        }
      }

      // Fetch allocations
      const allocRes = await client.query(
        `SELECT pa.amount_paise, pa.kind, b.bill_no, c.name AS cycle_name
         FROM payment_allocation pa
         LEFT JOIN bill b ON pa.bill_id = b.id
         LEFT JOIN bill_cycle c ON b.cycle_id = c.id
         WHERE pa.payment_id = $1`,
        [paymentId],
      );

      // Calculate flat remaining balance
      const balanceRes = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_paise ELSE -amount_paise END), 0) AS balance_paise
         FROM ledger_entry WHERE society_id = $1 AND flat_id = $2`,
        [societyId, p.flat_id],
      );
      const remainingBalancePaise = Number(balanceRes.rows[0]?.balance_paise || 0);

      // Latest audit hash stamp
      const latestAudit = await this.auditService.getLatestHash(societyId);

      // Short receipt hash (deterministic)
      const receiptRaw = `${societyId}:${p.receipt_no}:${p.amount_paise}:${p.received_on}:${p.flat_id}`;
      const receiptHash = crypto.createHash('sha256').update(receiptRaw).digest('hex').slice(0, 16);

      return {
        id: p.id,
        receiptNo: p.receipt_no,
        flatNumber: `${p.wing_name}-${p.flat_number}`,
        receivedFromName: p.received_from_name,
        amountPaise: Number(p.amount_paise),
        amountInWords: amountInWords(Number(p.amount_paise)),
        mode: p.mode,
        receivedOn: p.received_on,
        status: p.status,
        voidReason: p.void_reason,
        collectorName: p.collector_name,
        collectorRole: p.collector_role,
        allocations: allocRes.rows.map((a) => ({
          description: a.bill_no ? `Bill ${a.bill_no} (${a.cycle_name})` : a.kind,
          amountPaise: Number(a.amount_paise),
        })),
        remainingBalancePaise,
        receiptHash,
        auditChainStamp: latestAudit.hash.slice(0, 16),
        societyName: p.society_name,
        societyAddress: p.society_address,
        createdAt: p.created_at,
      };
    } finally {
      client.release();
    }
  }

  async verifyReceipt(societyId: string, query: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT p.id, p.receipt_no, p.amount_paise, p.received_on, p.status,
                f.flat_number, w.name AS wing_name
         FROM payment p
         JOIN flat f ON p.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         WHERE p.society_id = $1 AND (p.receipt_no = $2 OR p.id::text = $2)`,
        [societyId, query.trim()],
      );

      if (res.rows.length === 0) {
        return { matched: false, reason: 'No payment record found matching this receipt number.' };
      }

      const p = res.rows[0];
      return {
        matched: true,
        receiptNo: p.receipt_no,
        flatNumber: `${p.wing_name}-${p.flat_number}`,
        amountPaise: Number(p.amount_paise),
        receivedOn: p.received_on,
        status: p.status,
      };
    } finally {
      client.release();
    }
  }

  async listPayments(societyId: string, filter: { flatId?: string; limit?: number } = {}) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      let query = `
        SELECT p.*, f.flat_number, w.name AS wing_name, u.full_name AS collector_name
        FROM payment p
        JOIN flat f ON p.flat_id = f.id
        JOIN wing w ON f.wing_id = w.id
        JOIN app_user u ON p.received_by = u.id
        WHERE p.society_id = $1
      `;
      const params: any[] = [societyId];
      if (filter.flatId) {
        params.push(filter.flatId);
        query += ` AND p.flat_id = $${params.length}`;
      }
      query += ` ORDER BY p.received_on DESC, p.created_at DESC`;
      if (filter.limit) {
        params.push(filter.limit);
        query += ` LIMIT $${params.length}`;
      } else {
        query += ` LIMIT 100`;
      }
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ─── Daily Cash Sessions & Day Close ─────────────────────────────────────────

  async getSessionStatus(societyId: string, collectorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT s.*,
                COALESCE((SELECT SUM(p.amount_paise) FROM payment p WHERE p.session_id_fk = s.id AND p.status = 'RECORDED'), 0) AS total_collected_paise,
                (SELECT COUNT(p.id) FROM payment p WHERE p.session_id_fk = s.id AND p.status = 'RECORDED') AS payments_count
         FROM cash_session s
         WHERE s.society_id = $1 AND s.collector_id = $2 AND s.status = 'OPEN'
         ORDER BY s.opened_at DESC LIMIT 1`,
        [societyId, collectorId],
      );

      // Check for unclosed sessions older than 24h across society
      const unclosedRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM cash_session
         WHERE society_id = $1 AND status = 'OPEN' AND opened_at < NOW() - INTERVAL '24 hours'`,
        [societyId],
      );

      return {
        openSession: res.rows[0] || null,
        unclosedAlertCount: Number(unclosedRes.rows[0]?.cnt || 0),
      };
    } finally {
      client.release();
    }
  }

  async openSession(societyId: string, collectorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check if already open
      const existing = await client.query(
        `SELECT id FROM cash_session WHERE society_id = $1 AND collector_id = $2 AND status = 'OPEN'`,
        [societyId, collectorId],
      );
      if (existing.rows.length > 0) {
        return { sessionId: existing.rows[0].id, alreadyOpen: true };
      }

      // Check setting: require_prior_close
      const settingRes = await client.query(
        `SELECT setting_value FROM society_setting WHERE society_id = $1 AND setting_key = 'require_prior_close'`,
        [societyId],
      );
      if (settingRes.rows[0]?.setting_value === 'true') {
        const priorUnclosed = await client.query(
          `SELECT id, date FROM cash_session
           WHERE society_id = $1 AND collector_id = $2 AND status = 'OPEN'`,
          [societyId, collectorId],
        );
        if (priorUnclosed.rows.length > 0) {
          throw new BadRequestException(
            `Prior cash session for ${priorUnclosed.rows[0].date} is unclosed. Please close prior sessions before opening a new one.`,
          );
        }
      }

      const res = await client.query(
        `INSERT INTO cash_session (society_id, collector_id, date, status)
         VALUES ($1, $2, CURRENT_DATE, 'OPEN')
         RETURNING id`,
        [societyId, collectorId],
      );
      const sessionId = res.rows[0].id;

      await this.auditService.append({
        societyId,
        actorId: collectorId,
        actorRole: 'SECRETARY',
        action: 'CASH_SESSION_OPENED',
        entityType: 'CASH_SESSION',
        entityId: sessionId,
      });

      return { sessionId, status: 'OPEN' };
    } finally {
      client.release();
    }
  }

  async closeSession(
    societyId: string,
    collectorId: string,
    sessionId: string,
    dto: {
      countedPaise: number;
      varianceNote?: string;
      depositedPaise?: number;
      depositRef?: string;
      depositOn?: string;
    },
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const sessionRes = await client.query(
        `SELECT * FROM cash_session WHERE id = $1 AND society_id = $2 AND collector_id = $3 FOR UPDATE`,
        [sessionId, societyId, collectorId],
      );
      if (sessionRes.rows.length === 0) throw new NotFoundException('Cash session not found');

      // Calculate expected cash = sum of RECORDED cash payments in session
      const paymentsRes = await client.query(
        `SELECT COALESCE(SUM(amount_paise), 0) AS total_paise
         FROM payment
         WHERE session_id_fk = $1 AND status = 'RECORDED'`,
        [sessionId],
      );
      const expectedPaise = Number(paymentsRes.rows[0]?.total_paise || 0);
      const countedPaise = dto.countedPaise;
      const variancePaise = countedPaise - expectedPaise;

      if (variancePaise !== 0 && !dto.varianceNote) {
        throw new BadRequestException(
          `Cash variance of ${formatPaise(variancePaise)} detected (Expected: ${formatPaise(expectedPaise)}, Counted: ${formatPaise(countedPaise)}). A variance explanation note is mandatory.`,
        );
      }

      await client.query(
        `UPDATE cash_session SET
           status = 'CLOSED', closed_at = NOW(),
           expected_paise = $4, counted_paise = $5, variance_paise = $6, variance_note = $7,
           deposited_paise = $8, deposit_ref = $9, deposit_on = $10
         WHERE id = $1 AND society_id = $2`,
        [
          sessionId,
          societyId,
          collectorId,
          expectedPaise,
          countedPaise,
          variancePaise,
          dto.varianceNote || null,
          dto.depositedPaise || null,
          dto.depositRef || null,
          dto.depositOn || null,
        ],
      );

      await this.auditService.append({
        societyId,
        actorId: collectorId,
        actorRole: 'SECRETARY',
        action: 'CASH_SESSION_CLOSED',
        entityType: 'CASH_SESSION',
        entityId: sessionId,
        after: {
          expectedPaise,
          countedPaise,
          variancePaise,
        },
      });

      await client.query('COMMIT');
      return { success: true, expectedPaise, countedPaise, variancePaise };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async reconcileSession(societyId: string, actorId: string, sessionId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const sessionRes = await client.query(
        `SELECT * FROM cash_session WHERE id = $1 AND society_id = $2 FOR UPDATE`,
        [sessionId, societyId],
      );
      if (sessionRes.rows.length === 0) throw new NotFoundException('Cash session not found');
      const s = sessionRes.rows[0];

      if (s.status !== 'CLOSED') {
        throw new BadRequestException('Session must be in CLOSED status before reconciliation.');
      }

      // Maker-checker
      await this.verifyMakerChecker(client, societyId, actorId, s.collector_id, `Cash Session Reconciliation`);

      await client.query(
        `UPDATE cash_session SET status = 'RECONCILED', reconciled_by = $3, reconciled_at = NOW()
         WHERE id = $1 AND society_id = $2`,
        [sessionId, societyId, actorId],
      );

      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'CHAIRMAN',
        action: 'CASH_SESSION_RECONCILED',
        entityType: 'CASH_SESSION',
        entityId: sessionId,
      });

      await client.query('COMMIT');
      return { success: true, status: 'RECONCILED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Adjustments & Maker-Checker Queue ───────────────────────────────────────

  async createAdjustmentRequest(societyId: string, actorId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      if (!dto.reason || dto.reason.trim().length < 30) {
        throw new BadRequestException('A detailed reason of at least 30 characters is required for adjustments.');
      }

      const res = await client.query(
        `INSERT INTO adjustment_request (
           society_id, type, flat_id, amount_paise, reason, bill_id, payment_id, created_by, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
         RETURNING id`,
        [
          societyId,
          dto.type,
          dto.flatId,
          dto.amountPaise || 0,
          dto.reason,
          dto.billId || null,
          dto.paymentId || null,
          actorId,
        ],
      );
      const reqId = res.rows[0].id;

      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'SECRETARY',
        action: 'ADJUSTMENT_REQUESTED',
        entityType: 'ADJUSTMENT_REQUEST',
        entityId: reqId,
        after: dto,
      });

      // Notify approvers
      await this.notificationsService.send({
        societyId,
        targetRole: 'CHAIRMAN',
        title: `⚖️ Adjustment Approval Required (${dto.type})`,
        message: `An adjustment request of type ${dto.type} requires your review and approval.`,
        type: 'INFO',
        link: '/admin/billing/adjustments',
      });

      return { id: reqId, status: 'PENDING' };
    } finally {
      client.release();
    }
  }

  async decideAdjustment(
    societyId: string,
    actorId: string,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    decisionNote?: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const reqRes = await client.query(
        `SELECT * FROM adjustment_request WHERE id = $1 AND society_id = $2 FOR UPDATE`,
        [requestId, societyId],
      );
      if (reqRes.rows.length === 0) throw new NotFoundException('Adjustment request not found');
      const req = reqRes.rows[0];

      if (req.status !== 'PENDING') {
        throw new BadRequestException(`Request has already been ${req.status.toLowerCase()}.`);
      }

      // Maker-checker
      const { isSoleApprover } = await this.verifyMakerChecker(
        client,
        societyId,
        actorId,
        req.created_by,
        `Adjustment ${req.type}`,
      );

      if (decision === 'REJECTED') {
        await client.query(
          `UPDATE adjustment_request SET status = 'REJECTED', approved_by = $3, decided_at = NOW(), decision_note = $4
           WHERE id = $1 AND society_id = $2`,
          [requestId, societyId, actorId, decisionNote || null],
        );
        await client.query('COMMIT');
        return { success: true, status: 'REJECTED' };
      }

      // Execute approved adjustment
      if (req.type === 'VOID' && req.payment_id) {
        // Void payment: mark payment VOIDED, post REVERSAL entry, keep number marked VOID
        await client.query(
          `UPDATE payment SET status = 'VOIDED', voided_by = $3, void_reason = $4, void_approved_by = $5
           WHERE id = $1 AND society_id = $2`,
          [req.payment_id, societyId, req.created_by, req.reason, actorId],
        );

        // Fetch payment details
        const payRes = await client.query(
          `SELECT receipt_no, amount_paise FROM payment WHERE id = $1`,
          [req.payment_id],
        );
        const p = payRes.rows[0];

        // Post REVERSAL entry (DEBIT to offset the credit)
        await this.postLedgerEntryInternal(client, {
          societyId,
          flatId: req.flat_id,
          entryType: 'REVERSAL',
          direction: 'DEBIT',
          amountPaise: Number(p.amount_paise),
          refType: 'payment',
          refId: req.payment_id,
          narration: `REVERSAL of Voided Payment Receipt ${p.receipt_no}: ${req.reason}`,
          createdBy: actorId,
        });

        // Reopen bills allocated in this payment
        const allocsRes = await client.query(
          `SELECT bill_id FROM payment_allocation WHERE payment_id = $1 AND bill_id IS NOT NULL`,
          [req.payment_id],
        );
        for (const a of allocsRes.rows) {
          await client.query(
            `UPDATE bill SET status = 'ISSUED', updated_at = NOW() WHERE id = $1`,
            [a.bill_id],
          );
        }

        // Notify resident in-app
        const residentRes = await client.query(
          `SELECT id FROM app_user WHERE society_id = $1 AND flat_id = $2 AND role = 'RESIDENT'`,
          [societyId, req.flat_id],
        );
        for (const r of residentRes.rows) {
          await this.notificationsService.send({
            societyId,
            userId: r.id,
            title: `⚠️ Payment Receipt Voided: ${p.receipt_no}`,
            message: `Payment receipt ${p.receipt_no} for ${formatPaise(Number(p.amount_paise))} was voided. Reason: ${req.reason}. Balance has been adjusted.`,
            type: 'WARNING',
            link: '/app/statement',
          });
        }
      } else if (req.type === 'WAIVER' || req.type === 'CREDIT_NOTE') {
        // Post CREDIT entry to ledger
        await this.postLedgerEntryInternal(client, {
          societyId,
          flatId: req.flat_id,
          entryType: req.type,
          direction: 'CREDIT',
          amountPaise: Number(req.amount_paise),
          refType: 'adjustment',
          refId: req.id,
          narration: `${req.type}: ${req.reason}`,
          createdBy: actorId,
        });
      } else if (req.type === 'REFUND') {
        // Cash refund: post DEBIT entry
        await this.postLedgerEntryInternal(client, {
          societyId,
          flatId: req.flat_id,
          entryType: 'REFUND',
          direction: 'DEBIT',
          amountPaise: Number(req.amount_paise),
          refType: 'adjustment',
          refId: req.id,
          narration: `Cash Refund: ${req.reason}`,
          createdBy: actorId,
        });
      } else if (req.type === 'BILL_CANCEL' && req.bill_id) {
        // Bill cancel: ensure no payments made
        const paidRes = await client.query(
          `SELECT COUNT(*) AS cnt FROM payment_allocation WHERE bill_id = $1`,
          [req.bill_id],
        );
        if (Number(paidRes.rows[0]?.cnt || 0) > 0) {
          throw new BadRequestException('Cannot cancel a bill that has recorded payments. Void the payments first.');
        }

        const bRes = await client.query(`SELECT bill_no, total_paise FROM bill WHERE id = $1`, [req.bill_id]);
        const b = bRes.rows[0];

        await client.query(`UPDATE bill SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [req.bill_id]);

        // Post CREDIT entry to offset the bill debit
        await this.postLedgerEntryInternal(client, {
          societyId,
          flatId: req.flat_id,
          entryType: 'REVERSAL',
          direction: 'CREDIT',
          amountPaise: Number(b.total_paise),
          refType: 'bill',
          refId: req.bill_id,
          narration: `REVERSAL of Cancelled Bill ${b.bill_no}: ${req.reason}`,
          createdBy: actorId,
        });
      }

      await client.query(
        `UPDATE adjustment_request SET
           status = 'APPROVED', approved_by = $3, decided_at = NOW(),
           decision_note = $4, sole_approver_flag = $5
         WHERE id = $1 AND society_id = $2`,
        [requestId, societyId, actorId, decisionNote || null, isSoleApprover],
      );

      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'CHAIRMAN',
        action: `ADJUSTMENT_APPROVED`,
        entityType: 'ADJUSTMENT_REQUEST',
        entityId: requestId,
        after: { type: req.type, soleApprover: isSoleApprover },
      });

      await client.query('COMMIT');
      return { success: true, status: 'APPROVED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listAdjustments(societyId: string, status?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const conditions = ['a.society_id = $1'];
      const params: any[] = [societyId];
      if (status) {
        conditions.push(`a.status = $2`);
        params.push(status);
      }
      const res = await client.query(
        `SELECT a.*,
                f.flat_number, w.name AS wing_name,
                u1.full_name AS created_by_name,
                u2.full_name AS approved_by_name,
                p.receipt_no, b.bill_no
         FROM adjustment_request a
         JOIN flat f ON a.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         JOIN app_user u1 ON a.created_by = u1.id
         LEFT JOIN app_user u2 ON a.approved_by = u2.id
         LEFT JOIN payment p ON a.payment_id = p.id
         LEFT JOIN bill b ON a.bill_id = b.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY a.created_at DESC`,
        params,
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ─── Payment Disputes ─────────────────────────────────────────────────────────

  async createDispute(societyId: string, userId: string, flatId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO payment_dispute (
           society_id, flat_id, payment_id, kind, claim_amount_paise, claim_date,
           note, attachment_keys, created_by, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN')
         RETURNING id`,
        [
          societyId,
          flatId,
          dto.paymentId || null,
          dto.kind,
          dto.claimAmountPaise || null,
          dto.claimDate || null,
          dto.note,
          dto.attachmentKeys || [],
          userId,
        ],
      );
      const disputeId = res.rows[0].id;

      // Dispatched to CHAIRMAN, COMMITTEE, and GOVERNING_BODY
      for (const targetRole of ['CHAIRMAN', 'COMMITTEE', 'GOVERNING_BODY'] as const) {
        await this.notificationsService.send({
          societyId,
          targetRole,
          title: `🚩 Payment Dispute Raised (${dto.kind})`,
          message: `A resident reported a payment discrepancy: ${dto.note.slice(0, 80)}...`,
          type: 'ALERT',
          link: '/admin/billing/disputes',
        });
      }

      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'RESIDENT',
        action: 'PAYMENT_DISPUTE_RAISED',
        entityType: 'PAYMENT_DISPUTE',
        entityId: disputeId,
        after: dto,
      });

      return { id: disputeId, status: 'OPEN' };
    } finally {
      client.release();
    }
  }

  async listDisputes(societyId: string, status?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const conditions = ['d.society_id = $1'];
      const params: any[] = [societyId];
      if (status) {
        conditions.push(`d.status = $2`);
        params.push(status);
      }
      const res = await client.query(
        `SELECT d.*,
                f.flat_number, w.name AS wing_name,
                u.full_name AS resident_name, u.mobile AS resident_phone,
                p.receipt_no, p.amount_paise AS recorded_amount_paise
         FROM payment_dispute d
         JOIN flat f ON d.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         JOIN app_user u ON d.created_by = u.id
         LEFT JOIN payment p ON d.payment_id = p.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY d.created_at DESC`,
        params,
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async resolveDispute(
    societyId: string,
    actorId: string,
    disputeId: string,
    status: 'RESOLVED' | 'REJECTED',
    outcomeNote: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `UPDATE payment_dispute SET status = $3, outcome_note = $4, assigned_to = $5, updated_at = NOW()
         WHERE id = $1 AND society_id = $2
         RETURNING created_by`,
        [disputeId, societyId, status, outcomeNote, actorId],
      );
      if (res.rows.length === 0) throw new NotFoundException('Dispute not found');

      // Notify resident
      await this.notificationsService.send({
        societyId,
        userId: res.rows[0].created_by,
        title: `Payment Dispute ${status === 'RESOLVED' ? 'Resolved' : 'Closed'}`,
        message: `Your payment dispute was reviewed: ${outcomeNote}`,
        type: status === 'RESOLVED' ? 'SUCCESS' : 'INFO',
        link: '/app/disputes',
      });

      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'CHAIRMAN',
        action: 'PAYMENT_DISPUTE_DECIDED',
        entityType: 'PAYMENT_DISPUTE',
        entityId: disputeId,
        after: { status, outcomeNote },
      });

      return { success: true };
    } finally {
      client.release();
    }
  }

  // ─── Late Fee Engine ──────────────────────────────────────────────────────────

  async runNightlyLateFeeSweep() {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Fetch active late fee rules
      const rulesRes = await client.query(
        `SELECT * FROM late_fee_rule WHERE active = TRUE`,
      );

      for (const rule of rulesRes.rows) {
        const graceDays = rule.grace_days || 0;

        // Find overdue bills without late fees posted yet
        const overdueBills = await client.query(
          `SELECT b.id, b.society_id, b.flat_id, b.bill_no, b.total_paise, b.due_date
           FROM bill b
           WHERE b.society_id = $1
             AND b.status IN ('ISSUED', 'PARTIALLY_PAID')
             AND b.due_date + ($2 || ' days')::INTERVAL < CURRENT_DATE
             AND NOT EXISTS (
               SELECT 1 FROM ledger_entry le
               WHERE le.ref_type = 'late_fee' AND le.ref_id = b.id
             )`,
          [rule.society_id, graceDays],
        );

        for (const b of overdueBills.rows) {
          let feePaise = 0;
          if (rule.type === 'FLAT') {
            feePaise = Number(rule.value_paise || 0);
          } else if (rule.type === 'PERCENT_PER_MONTH') {
            feePaise = applyPercent(Number(b.total_paise), Number(rule.percent || 0));
          } else {
            // PERCENT_PER_DAY
            const daysOverdue = Math.floor(
              (Date.now() - new Date(b.due_date).getTime()) / (1000 * 60 * 60 * 24),
            ) - graceDays;
            feePaise = applyPercent(Number(b.total_paise), Number(rule.percent || 0) * Math.max(1, daysOverdue));
          }

          if (rule.cap_paise && feePaise > Number(rule.cap_paise)) {
            feePaise = Number(rule.cap_paise);
          }

          if (feePaise > 0) {
            await this.postLedgerEntryInternal(client, {
              societyId: b.society_id,
              flatId: b.flat_id,
              entryType: 'LATE_FEE',
              direction: 'DEBIT',
              amountPaise: feePaise,
              refType: 'late_fee',
              refId: b.id,
              narration: `Late fee on bill ${b.bill_no}: ${formatPaise(feePaise)} (${rule.type})`,
            });
          }
        }
      }
    } finally {
      client.release();
    }
  }

  // ─── Ledger & Statement ──────────────────────────────────────────────────────

  async getFlatStatement(societyId: string, flatId: string, requestingUserId: string, isAdmin: boolean = false) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // IDOR check: resident can only see their own flat
      if (!isAdmin) {
        const userRes = await client.query(`SELECT flat_id FROM app_user WHERE id = $1`, [requestingUserId]);
        if (userRes.rows[0]?.flat_id !== flatId) {
          throw new ForbiddenException('Access denied: You can only view statements for your own flat.');
        }
      }

      const entriesRes = await client.query(
        `SELECT le.*, u.full_name AS created_by_name
         FROM ledger_entry le
         LEFT JOIN app_user u ON le.created_by = u.id
         WHERE le.society_id = $1 AND le.flat_id = $2
         ORDER BY le.seq ASC`,
        [societyId, flatId],
      );

      let runningBalance = 0;
      const entriesWithBalance = entriesRes.rows.map((e) => {
        const amount = Number(e.amount_paise);
        if (e.direction === 'DEBIT') {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
        return {
          id: e.id,
          seq: Number(e.seq),
          entryType: e.entry_type,
          direction: e.direction,
          amountPaise: amount,
          narration: e.narration,
          refType: e.ref_type,
          refId: e.ref_id,
          createdAt: e.created_at,
          createdByName: e.created_by_name || 'System',
          runningBalancePaise: runningBalance,
          hash: e.hash,
        };
      });

      return {
        flatId,
        currentBalancePaise: runningBalance,
        entries: entriesWithBalance,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Verify mathematical integrity of the per-flat ledger hash chain.
   */
  async verifyFlatLedgerChain(societyId: string, flatId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM ledger_entry WHERE society_id = $1 AND flat_id = $2 ORDER BY seq ASC`,
        [societyId, flatId],
      );

      let prevHash = '0'.repeat(64);
      let isValid = true;
      let tamperedSeq: number | null = null;

      for (const row of res.rows) {
        if (row.prev_hash !== prevHash) {
          isValid = false;
          tamperedSeq = Number(row.seq);
          break;
        }

        const payload = JSON.stringify({
          societyId: row.society_id,
          flatId: row.flat_id,
          seq: Number(row.seq),
          entryType: row.entry_type,
          direction: row.direction,
          amountPaise: Number(row.amount_paise),
          refType: row.ref_type,
          refId: row.ref_id,
          narration: row.narration,
        });

        const expectedHash = crypto
          .createHash('sha256')
          .update(`${prevHash}${payload}`)
          .digest('hex');

        if (row.hash !== expectedHash) {
          isValid = false;
          tamperedSeq = Number(row.seq);
          break;
        }

        prevHash = row.hash;
      }

      return {
        flatId,
        verified: isValid,
        totalEntries: res.rows.length,
        tamperedSeq,
        latestHash: prevHash,
      };
    } finally {
      client.release();
    }
  }

  // ─── Admin Overview & Reports ────────────────────────────────────────────────

  async getAdminOverview(societyId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const billedRes = await client.query(
        `SELECT COALESCE(SUM(total_paise), 0) AS total FROM bill WHERE society_id = $1 AND status != 'CANCELLED'`,
        [societyId],
      );
      const collectedRes = await client.query(
        `SELECT COALESCE(SUM(amount_paise), 0) AS total FROM payment WHERE society_id = $1 AND status = 'RECORDED'`,
        [societyId],
      );
      const outstandingRes = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_paise ELSE -amount_paise END), 0) AS total
         FROM ledger_entry WHERE society_id = $1`,
        [societyId],
      );
      const unclosedRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM cash_session WHERE society_id = $1 AND status = 'OPEN'`,
        [societyId],
      );
      const pendingAdjRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM adjustment_request WHERE society_id = $1 AND status = 'PENDING'`,
        [societyId],
      );
      const openDisputesRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM payment_dispute WHERE society_id = $1 AND status = 'OPEN'`,
        [societyId],
      );

      const billed = Number(billedRes.rows[0]?.total || 0);
      const collected = Number(collectedRes.rows[0]?.total || 0);
      const collectionRate = billed > 0 ? roundHalfUp((collected / billed) * 100) : 0;

      return {
        totalBilledPaise: billed,
        totalCollectedPaise: collected,
        totalOutstandingPaise: Math.max(0, Number(outstandingRes.rows[0]?.total || 0)),
        collectionRate,
        unclosedSessionsCount: Number(unclosedRes.rows[0]?.cnt || 0),
        pendingAdjustmentsCount: Number(pendingAdjRes.rows[0]?.cnt || 0),
        openDisputesCount: Number(openDisputesRes.rows[0]?.cnt || 0),
      };
    } finally {
      client.release();
    }
  }

  async getDefaulters(societyId: string, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Audit defaulter list view
      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'ADMIN',
        action: 'DEFAULTERS_LIST_VIEWED',
        entityType: 'REPORT',
      });

      const res = await client.query(
        `SELECT f.id AS flat_id, f.flat_number, w.name AS wing_name, f.occupancy,
                COALESCE(SUM(CASE WHEN le.direction = 'DEBIT' THEN le.amount_paise ELSE -le.amount_paise END), 0) AS outstanding_paise,
                MIN(b.due_date) AS oldest_overdue_date
         FROM flat f
         JOIN wing w ON f.wing_id = w.id
         JOIN ledger_entry le ON f.id = le.flat_id
         LEFT JOIN bill b ON f.id = b.flat_id AND b.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
         WHERE f.society_id = $1
         GROUP BY f.id, f.flat_number, w.name, f.occupancy
         HAVING SUM(CASE WHEN le.direction = 'DEBIT' THEN le.amount_paise ELSE -le.amount_paise END) > 0
         ORDER BY outstanding_paise DESC`,
        [societyId],
      );

      const now = Date.now();
      return res.rows.map((row) => {
        const days = row.oldest_overdue_date
          ? Math.floor((now - new Date(row.oldest_overdue_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        let bucket = '0-30';
        if (days > 90) bucket = '90+';
        else if (days > 60) bucket = '61-90';
        else if (days > 30) bucket = '31-60';

        return {
          flatId: row.flat_id,
          flatNumber: `${row.wing_name}-${row.flat_number}`,
          occupancy: row.occupancy,
          outstandingPaise: Number(row.outstanding_paise),
          daysOverdue: Math.max(0, days),
          bucket,
        };
      });
    } finally {
      client.release();
    }
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  async getSettings(societyId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT setting_key, setting_value FROM society_setting
         WHERE society_id = $1 AND setting_key LIKE 'billing_%' OR setting_key = 'receipt_prefix'`,
        [societyId],
      );
      const settings: Record<string, string> = {
        receipt_prefix: 'RC',
        billing_fy_start_month: '4',
        billing_gst_note: 'Confirm GST applicability with your chartered accountant',
        billing_cash_instructions: 'Please pay cash at the society office during office hours.',
      };
      for (const row of res.rows) {
        settings[row.setting_key] = row.setting_value;
      }
      return settings;
    } finally {
      client.release();
    }
  }

  async updateSettings(societyId: string, actorId: string, settings: Record<string, string>) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      for (const [k, v] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO society_setting (society_id, setting_key, setting_value)
           VALUES ($1, $2, $3)
           ON CONFLICT (society_id, setting_key) DO UPDATE
           SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
          [societyId, k, v],
        );
      }
      await this.auditService.append({
        societyId,
        actorId,
        actorRole: 'SUPER_ADMIN',
        action: 'BILLING_SETTINGS_UPDATED',
        entityType: 'SOCIETY_SETTING',
        after: settings,
      });
      return { success: true };
    } finally {
      client.release();
    }
  }

  // ─── Internal Ledger Helper ──────────────────────────────────────────────────

  private async postLedgerEntryInternal(
    client: any,
    params: {
      societyId: string;
      flatId: string;
      entryType: string;
      direction: 'DEBIT' | 'CREDIT';
      amountPaise: number;
      refType: string;
      refId: string;
      narration: string;
      createdBy?: string;
      reversesEntryId?: string;
    },
  ) {
    const lastRes = await client.query(
      `SELECT seq, hash FROM ledger_entry
       WHERE society_id = $1 AND flat_id = $2
       ORDER BY seq DESC LIMIT 1`,
      [params.societyId, params.flatId],
    );
    const prevSeq = lastRes.rows.length > 0 ? Number(lastRes.rows[0].seq) : 0;
    const prevHash = lastRes.rows.length > 0 ? lastRes.rows[0].hash : '0'.repeat(64);
    const newSeq = prevSeq + 1;

    const payload = JSON.stringify({
      societyId: params.societyId,
      flatId: params.flatId,
      seq: newSeq,
      entryType: params.entryType,
      direction: params.direction,
      amountPaise: params.amountPaise,
      refType: params.refType,
      refId: params.refId,
      narration: params.narration,
    });

    const hash = crypto
      .createHash('sha256')
      .update(`${prevHash}${payload}`)
      .digest('hex');

    await client.query(
      `INSERT INTO ledger_entry (
        society_id, flat_id, seq, entry_type, direction, amount_paise,
        ref_type, ref_id, reverses_entry_id, narration, created_by, prev_hash, hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        params.societyId,
        params.flatId,
        newSeq,
        params.entryType,
        params.direction,
        params.amountPaise,
        params.refType,
        params.refId,
        params.reversesEntryId || null,
        params.narration,
        params.createdBy || null,
        prevHash,
        hash,
      ],
    );
    return { seq: newSeq, hash };
  }
}
