import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { BookingPassService } from './booking-pass.service';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const BOOKING_HOLD_QUEUE = 'amenity-booking-hold-queue';

@Injectable()
export class AmenitiesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmenitiesService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private gateway: NotificationsGateway,
    private bookingPassService: BookingPassService,
  ) {}

  async onModuleInit() {
    this.initQueueAndWorker();
    // Hourly sweep to expire holds and release slots (recovery from missed BullMQ jobs)
    this.sweepTimer = setInterval(
      () => this.runHoldExpirySweep().catch((e) => this.logger.error(`Hold sweep error: ${e.message}`)),
      60 * 60 * 1000,
    );
  }

  async onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }

  private initQueueAndWorker() {
    try {
      const connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
      this.queue = new Queue(BOOKING_HOLD_QUEUE, { connection });
      this.worker = new Worker(
        BOOKING_HOLD_QUEUE,
        async (job) => {
          if (job.name === 'expire-hold') {
            await this.expireBookingHold(job.data.bookingId);
          }
        },
        { connection },
      );
      this.logger.log('🏟️  Amenity booking hold queue initialized.');
    } catch (err: any) {
      this.logger.warn(`Amenity queue init skipped (Redis unavailable): ${err.message}`);
    }
  }

  // ─── Amenity CRUD ────────────────────────────────────────────────────────────

  async listAmenities(societyId: string, lang: string = 'en') {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT a.*,
          CASE $2 WHEN 'hi' THEN a.name_hi WHEN 'mr' THEN a.name_mr ELSE a.name_en END AS name,
          CASE $2 WHEN 'hi' THEN a.description_hi WHEN 'mr' THEN a.description_mr ELSE a.description_en END AS description
         FROM amenity a
         WHERE a.society_id = $1 AND a.active = TRUE
         ORDER BY a.type, a.name_en`,
        [societyId, lang],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getAmenity(societyId: string, amenityId: string, lang: string = 'en') {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT a.*,
          CASE $3 WHEN 'hi' THEN a.name_hi WHEN 'mr' THEN a.name_mr ELSE a.name_en END AS name,
          CASE $3 WHEN 'hi' THEN a.description_hi WHEN 'mr' THEN a.description_mr ELSE a.description_en END AS description,
          CASE $3 WHEN 'hi' THEN a.rules_hi WHEN 'mr' THEN a.rules_mr ELSE a.rules_en END AS rules
         FROM amenity a
         WHERE a.id = $1 AND a.society_id = $2`,
        [amenityId, societyId, lang],
      );
      if (res.rowCount === 0) throw new NotFoundException('Amenity not found');
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async createAmenity(societyId: string, actorId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `INSERT INTO amenity (
          society_id, type, name_en, name_hi, name_mr,
          description_en, description_hi, description_mr,
          rules_en, rules_hi, rules_mr, photo_keys,
          capacity_total, mode, open_hours, slot_minutes, min_slots, max_slots,
          advance_days_max, min_notice_hours, max_bookings_per_flat_per_week, max_guests,
          fee_mode, fee_paise, deposit_paise, fee_collection,
          hold_hours, requires_approval, cancellation_free_hours, cancellation_fee_percent, active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
        RETURNING id`,
        [
          societyId, dto.type, dto.nameEn, dto.nameHi, dto.nameMr,
          dto.descriptionEn || null, dto.descriptionHi || null, dto.descriptionMr || null,
          dto.rulesEn || null, dto.rulesHi || null, dto.rulesMr || null,
          JSON.stringify(dto.photoKeys || []),
          dto.capacityTotal, dto.mode, dto.openHours ? JSON.stringify(dto.openHours) : null,
          dto.slotMinutes, dto.minSlots, dto.maxSlots,
          dto.advanceDaysMax, dto.minNoticeHours, dto.maxBookingsPerFlatPerWeek, dto.maxGuests,
          dto.feeMode, dto.feePaise, dto.depositPaise, dto.feeCollection,
          dto.holdHours, dto.requiresApproval, dto.cancellationFreeHours,
          dto.cancellationFeePercent, dto.active,
        ],
      );
      const amenityId = res.rows[0].id;
      await this.auditService.append({
        societyId, actorId, actorRole: 'ADMIN',
        action: 'AMENITY_CREATED', entityType: 'AMENITY', entityId: amenityId,
        after: { nameEn: dto.nameEn, type: dto.type },
      });
      return { id: amenityId };
    } finally {
      client.release();
    }
  }

  async updateAmenity(societyId: string, actorId: string, amenityId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const prev = await client.query(
        `SELECT * FROM amenity WHERE id = $1 AND society_id = $2`, [amenityId, societyId],
      );
      if (prev.rowCount === 0) throw new NotFoundException('Amenity not found');

      await client.query(
        `UPDATE amenity SET
          type=$3, name_en=$4, name_hi=$5, name_mr=$6,
          description_en=$7, description_hi=$8, description_mr=$9,
          rules_en=$10, rules_hi=$11, rules_mr=$12, photo_keys=$13,
          capacity_total=$14, mode=$15, open_hours=$16,
          slot_minutes=$17, min_slots=$18, max_slots=$19,
          advance_days_max=$20, min_notice_hours=$21, max_bookings_per_flat_per_week=$22, max_guests=$23,
          fee_mode=$24, fee_paise=$25, deposit_paise=$26, fee_collection=$27,
          hold_hours=$28, requires_approval=$29, cancellation_free_hours=$30,
          cancellation_fee_percent=$31, active=$32, updated_at=NOW()
         WHERE id=$1 AND society_id=$2`,
        [
          amenityId, societyId,
          dto.type, dto.nameEn, dto.nameHi, dto.nameMr,
          dto.descriptionEn || null, dto.descriptionHi || null, dto.descriptionMr || null,
          dto.rulesEn || null, dto.rulesHi || null, dto.rulesMr || null,
          JSON.stringify(dto.photoKeys || []),
          dto.capacityTotal, dto.mode, dto.openHours ? JSON.stringify(dto.openHours) : null,
          dto.slotMinutes, dto.minSlots, dto.maxSlots,
          dto.advanceDaysMax, dto.minNoticeHours, dto.maxBookingsPerFlatPerWeek, dto.maxGuests,
          dto.feeMode, dto.feePaise, dto.depositPaise, dto.feeCollection,
          dto.holdHours, dto.requiresApproval, dto.cancellationFreeHours,
          dto.cancellationFeePercent, dto.active,
        ],
      );
      await this.auditService.append({
        societyId, actorId, actorRole: 'ADMIN',
        action: 'AMENITY_UPDATED', entityType: 'AMENITY', entityId: amenityId,
        before: { nameEn: prev.rows[0].name_en }, after: { nameEn: dto.nameEn },
      });
      return { success: true };
    } finally {
      client.release();
    }
  }

  // ─── Slot Availability ───────────────────────────────────────────────────────

  /**
   * Return slot availability for a week (or range) for a given amenity.
   * For EXCLUSIVE: slot is available if no active booking overlaps.
   * For CAPACITY: slot is available if slot_counter.booked_people < capacity_total.
   */
  async getSlotAvailability(
    societyId: string,
    amenityId: string,
    fromDate: string,
    toDate: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const amenityRes = await client.query(
        `SELECT * FROM amenity WHERE id = $1 AND society_id = $2`,
        [amenityId, societyId],
      );
      if (amenityRes.rowCount === 0) throw new NotFoundException('Amenity not found');
      const amenity = amenityRes.rows[0];

      // Get all active bookings in the range
      const bookingsRes = await client.query(
        `SELECT
           lower(during)::text AS slot_start,
           upper(during)::text AS slot_end,
           status, people_count, flat_id
         FROM booking
         WHERE amenity_id = $1
           AND status IN ('PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED')
           AND during && tstzrange($2::timestamptz, $3::timestamptz)`,
        [amenityId, fromDate, toDate],
      );

      // Get blackouts and closures
      const blackoutsRes = await client.query(
        `SELECT from_at::text, to_at::text, reason FROM amenity_blackout
         WHERE amenity_id = $1 AND to_at > $2 AND from_at < $3`,
        [amenityId, fromDate, toDate],
      );
      const closuresRes = await client.query(
        `SELECT from_at::text, to_at::text, reason FROM amenity_closure
         WHERE amenity_id = $1 AND to_at > $2 AND from_at < $3`,
        [amenityId, fromDate, toDate],
      );

      return {
        amenityId,
        mode: amenity.mode,
        capacityTotal: amenity.capacity_total,
        slotMinutes: amenity.slot_minutes,
        openHours: amenity.open_hours,
        bookings: bookingsRes.rows,
        blackouts: blackoutsRes.rows,
        closures: closuresRes.rows,
      };
    } finally {
      client.release();
    }
  }

  // ─── Booking Creation ────────────────────────────────────────────────────────

  /**
   * 9-step validation order per spec:
   * 1. Amenity active
   * 2. Inside open hours
   * 3. Not blacked-out or closed
   * 4. Min notice and max advance
   * 5. Slot rules (min/max slots)
   * 6. Per-flat weekly limit
   * 7. No overlapping booking by the same flat
   * 8. Optional dues rule
   * 9. Hold or confirm
   */
  async createBooking(
    societyId: string,
    userId: string,
    flatId: string,
    dto: {
      amenityId: string;
      slotStart: string;
      slotCount: number;
      peopleCount: number;
      guestsCount: number;
      purpose: string;
      overrideDues?: boolean;
      overrideNote?: string;
    },
    ip?: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Step 1: Amenity active
      const amenityRes = await client.query(
        `SELECT * FROM amenity WHERE id = $1 AND society_id = $2`,
        [dto.amenityId, societyId],
      );
      if (amenityRes.rowCount === 0 || !amenityRes.rows[0].active) {
        throw new BadRequestException('Amenity is not available for booking');
      }
      const amenity = amenityRes.rows[0];

      const slotStart = new Date(dto.slotStart);
      const slotEnd = new Date(slotStart.getTime() + dto.slotCount * amenity.slot_minutes * 60 * 1000);
      const now = new Date();

      // Step 2: Inside open hours
      if (amenity.open_hours) {
        const dayOfWeek = slotStart.getDay().toString();
        const dayHours = amenity.open_hours[dayOfWeek];
        if (!dayHours || !dayHours.enabled) {
          throw new BadRequestException('Amenity is not open on the requested day');
        }
        const openTime = this.parseTime(dayHours.open, slotStart);
        const closeTime = this.parseTime(dayHours.close, slotStart);
        if (slotStart < openTime || slotEnd > closeTime) {
          throw new BadRequestException('Requested slot is outside amenity opening hours');
        }
      }

      // Step 3: Not blacked-out or closed
      const blockCheck = await client.query(
        `SELECT id FROM amenity_blackout
         WHERE amenity_id = $1 AND from_at < $3 AND to_at > $2
         UNION ALL
         SELECT id FROM amenity_closure
         WHERE amenity_id = $1 AND from_at < $3 AND to_at > $2
         LIMIT 1`,
        [dto.amenityId, slotStart, slotEnd],
      );
      if (blockCheck.rowCount! > 0) {
        throw new BadRequestException('Amenity is unavailable during the requested time (blackout or closure)');
      }

      // Step 4: Min notice and max advance
      const hoursFromNow = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursFromNow < amenity.min_notice_hours) {
        throw new BadRequestException(
          `Booking requires at least ${amenity.min_notice_hours} hour(s) advance notice`,
        );
      }
      if (hoursFromNow > amenity.advance_days_max * 24) {
        throw new BadRequestException(
          `Cannot book more than ${amenity.advance_days_max} days in advance`,
        );
      }

      // Step 5: Slot rules
      if (dto.slotCount < amenity.min_slots || dto.slotCount > amenity.max_slots) {
        throw new BadRequestException(
          `Slot count must be between ${amenity.min_slots} and ${amenity.max_slots}`,
        );
      }

      // Step 6: Per-flat weekly limit
      const weekStart = new Date(slotStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weeklyCountRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM booking
         WHERE amenity_id = $1 AND flat_id = $2
           AND status IN ('PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED')
           AND lower(during) >= $3 AND lower(during) < $4`,
        [dto.amenityId, flatId, weekStart, weekEnd],
      );
      if (Number(weeklyCountRes.rows[0].cnt) >= amenity.max_bookings_per_flat_per_week) {
        throw new BadRequestException(
          `Flat has reached the maximum of ${amenity.max_bookings_per_flat_per_week} booking(s) per week for this amenity`,
        );
      }

      // Step 7: No overlapping booking by the same flat (different amenities is fine)
      const flatOverlapRes = await client.query(
        `SELECT id FROM booking
         WHERE amenity_id = $1 AND flat_id = $2
           AND status IN ('PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED')
           AND during && tstzrange($3::timestamptz, $4::timestamptz)`,
        [dto.amenityId, flatId, slotStart, slotEnd],
      );
      if (flatOverlapRes.rowCount! > 0) {
        throw new BadRequestException('Your flat already has a booking that overlaps this slot');
      }

      // Step 8: Optional dues rule
      const dueRuleRes = await client.query(
        `SELECT setting_value FROM society_setting
         WHERE society_id = $1 AND setting_key = 'block_booking_if_overdue_days'`,
        [societyId],
      );
      if (dueRuleRes.rows.length > 0 && dueRuleRes.rows[0].setting_value !== 'OFF' && !dto.overrideDues) {
        const overdueDays = Number(dueRuleRes.rows[0].setting_value);
        const overdueCheck = await client.query(
          `SELECT COUNT(*) AS cnt FROM bill
           WHERE flat_id = $1 AND society_id = $2
             AND status IN ('ISSUED','PARTIALLY_PAID','OVERDUE')
             AND due_date < NOW() - ($3 || ' days')::INTERVAL`,
          [flatId, societyId, overdueDays],
        );
        if (Number(overdueCheck.rows[0].cnt) > 0) {
          throw new ForbiddenException(
            `Booking blocked: flat has overdue bills older than ${overdueDays} day(s). Please clear dues or contact the office.`,
          );
        }
      }

      // Step 9: Determine status and handle CAPACITY mode
      let initialStatus: string;
      let holdExpiresAt: Date | null = null;

      if (amenity.mode === 'CAPACITY') {
        // Lock slot_counter row and check capacity
        await client.query(
          `INSERT INTO slot_counter (amenity_id, slot_start, booked_people)
           VALUES ($1, $2, 0)
           ON CONFLICT (amenity_id, slot_start) DO NOTHING`,
          [dto.amenityId, slotStart],
        );
        const counterRes = await client.query(
          `SELECT booked_people FROM slot_counter
           WHERE amenity_id = $1 AND slot_start = $2
           FOR UPDATE`,
          [dto.amenityId, slotStart],
        );
        const currentPeople = Number(counterRes.rows[0]?.booked_people || 0);
        if (currentPeople + dto.peopleCount > amenity.capacity_total) {
          throw new BadRequestException(
            `Amenity is at capacity for this slot (${currentPeople}/${amenity.capacity_total} people booked)`,
          );
        }
        await client.query(
          `UPDATE slot_counter SET booked_people = booked_people + $3
           WHERE amenity_id = $1 AND slot_start = $2`,
          [dto.amenityId, slotStart, dto.peopleCount],
        );
      }

      if (amenity.requires_approval) {
        initialStatus = 'PENDING_APPROVAL';
      } else if (amenity.fee_mode !== 'NONE' && amenity.fee_collection === 'COLLECT_BEFORE_CONFIRM') {
        initialStatus = 'AWAITING_PAYMENT';
        holdExpiresAt = new Date(now.getTime() + amenity.hold_hours * 60 * 60 * 1000);
      } else {
        initialStatus = 'CONFIRMED';
      }

      const feePaise = amenity.fee_mode === 'NONE'
        ? 0
        : amenity.fee_mode === 'PER_SLOT'
        ? amenity.fee_paise * dto.slotCount
        : amenity.fee_paise;

      const bookingRes = await client.query(
        `INSERT INTO booking (
          society_id, amenity_id, flat_id, booked_by,
          during, slot_count, people_count, guests_count,
          purpose, status, hold_expires_at, fee_paise, deposit_paise,
          override_dues, override_note
        ) VALUES ($1,$2,$3,$4, tstzrange($5::timestamptz,$6::timestamptz), $7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING id`,
        [
          societyId, dto.amenityId, flatId, userId,
          slotStart, slotEnd, dto.slotCount, dto.peopleCount, dto.guestsCount,
          dto.purpose, initialStatus, holdExpiresAt, feePaise, amenity.deposit_paise,
          dto.overrideDues || false, dto.overrideNote || null,
        ],
      );
      const bookingId = bookingRes.rows[0].id;

      // Generate pass token for confirmed bookings
      if (initialStatus === 'CONFIRMED') {
        const { token, tokenHash } = this.bookingPassService.generatePassToken({
          bookingId, societyId, amenityId: dto.amenityId,
          amenityName: amenity.name_en, flatId,
          slotStart: slotStart.toISOString(), slotEnd: slotEnd.toISOString(),
          serial: `${Date.now()}`,
        });
        await client.query(
          `UPDATE booking SET pass_token_hash = $2 WHERE id = $1`, [bookingId, tokenHash],
        );
        // Emit live slot event
        this.gateway.emitToSociety(societyId, 'booking.slot', {
          amenityId: dto.amenityId, bookingId, status: 'CONFIRMED',
          slotStart: slotStart.toISOString(), slotEnd: slotEnd.toISOString(),
        });
        // Store pass token in booking_event (residents retrieve via booking detail)
        await client.query(
          `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type, note)
           VALUES ($1,$2,$3,'RESIDENT','CONFIRMED',$4)`,
          [societyId, bookingId, userId, token],
        );
      }

      // Booking event log
      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type)
         VALUES ($1,$2,$3,'RESIDENT','CREATED')`,
        [societyId, bookingId, userId],
      );

      // ADD_TO_NEXT_BILL: post DEBIT to ledger immediately
      if (initialStatus === 'CONFIRMED' && amenity.fee_collection === 'ADD_TO_NEXT_BILL' && feePaise > 0) {
        await this.postLedgerEntry(client, {
          societyId, flatId, entryType: 'AMENITY_FEE', direction: 'DEBIT',
          amountPaise: feePaise, refType: 'booking', refId: bookingId,
          narration: `Amenity fee: ${amenity.name_en} (${slotStart.toLocaleDateString()})`,
          createdBy: userId,
        });
      }

      if (amenity.deposit_paise > 0 && initialStatus === 'CONFIRMED') {
        await this.postLedgerEntry(client, {
          societyId, flatId, entryType: 'DEPOSIT', direction: 'DEBIT',
          amountPaise: amenity.deposit_paise, refType: 'booking', refId: bookingId,
          narration: `Amenity deposit: ${amenity.name_en}`,
          createdBy: userId,
        });
      }

      await this.auditService.append({
        societyId, actorId: userId, actorRole: 'RESIDENT',
        action: 'AMENITY_BOOKING_CREATED', entityType: 'BOOKING', entityId: bookingId,
        after: { amenityId: dto.amenityId, status: initialStatus, feePaise },
        ip,
      });

      // If AWAITING_PAYMENT, schedule hold expiry job
      if (holdExpiresAt && this.queue) {
        const delayMs = holdExpiresAt.getTime() - Date.now();
        await this.queue.add('expire-hold', { bookingId }, { delay: delayMs });
      }

      // Notify admins if PENDING_APPROVAL
      if (initialStatus === 'PENDING_APPROVAL') {
        await this.notificationsService.send({
          societyId, targetRole: 'SECRETARY',
          title: '🏟️ Amenity Booking Approval Required',
          message: `A booking for ${amenity.name_en} requires your approval.`,
          type: 'INFO', link: `/admin/bookings/${bookingId}`,
        });
      }

      await client.query('COMMIT');
      return { bookingId, status: initialStatus, holdExpiresAt };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Booking Hold Expiry ──────────────────────────────────────────────────────

  async runHoldExpirySweep() {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT id FROM booking
         WHERE status = 'AWAITING_PAYMENT' AND hold_expires_at <= NOW()`,
      );
      for (const row of res.rows) {
        await this.expireBookingHold(row.id);
      }
    } finally {
      client.release();
    }
  }

  async expireBookingHold(bookingId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const bookingRes = await client.query(
        `UPDATE booking SET status='EXPIRED', updated_at=NOW()
         WHERE id=$1 AND status='AWAITING_PAYMENT' AND hold_expires_at <= NOW()
         RETURNING society_id, amenity_id, flat_id, booked_by, during, people_count, slot_count`,
        [bookingId],
      );
      if (bookingRes.rowCount === 0) {
        await client.query('COMMIT');
        return;
      }
      const b = bookingRes.rows[0];

      // For CAPACITY mode, release slot_counter
      const amenityRes = await client.query(
        `SELECT mode FROM amenity WHERE id = $1`, [b.amenity_id],
      );
      if (amenityRes.rows[0]?.mode === 'CAPACITY') {
        const slotStart = new Date(b.during.split(',')[0].replace('[', ''));
        await client.query(
          `UPDATE slot_counter SET booked_people = GREATEST(0, booked_people - $3)
           WHERE amenity_id = $1 AND slot_start = $2`,
          [b.amenity_id, slotStart, b.people_count],
        );
      }

      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_role, event_type)
         VALUES ($1,$2,'SYSTEM','EXPIRED')`,
        [b.society_id, bookingId],
      );

      // Notify resident
      await this.notificationsService.send({
        societyId: b.society_id, userId: b.booked_by,
        title: '⏰ Booking Hold Expired',
        message: 'Your amenity booking hold has expired as payment was not received in time. Please book again.',
        type: 'WARNING', link: `/app/amenities`,
      });

      // Emit slot available event
      this.gateway.emitToSociety(b.society_id, 'booking.slot', {
        amenityId: b.amenity_id, bookingId, status: 'EXPIRED',
      });

      await this.auditService.append({
        societyId: b.society_id, actorRole: 'SYSTEM',
        action: 'AMENITY_BOOKING_HOLD_EXPIRED', entityType: 'BOOKING', entityId: bookingId,
      });

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Approval / Rejection (admin) ────────────────────────────────────────────

  async approveBooking(societyId: string, actorId: string, bookingId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE booking SET status='CONFIRMED', updated_at=NOW()
         WHERE id=$1 AND society_id=$2 AND status='PENDING_APPROVAL'
         RETURNING booked_by, amenity_id, flat_id, fee_paise, deposit_paise, fee_collection, during`,
        [bookingId, societyId],
      );
      if (res.rowCount === 0) throw new BadRequestException('Booking not found or not awaiting approval');
      const b = res.rows[0];

      // Generate pass token
      const amenityRes = await client.query(`SELECT name_en FROM amenity WHERE id = $1`, [b.amenity_id]);
      const slotStart = new Date(b.during.split(',')[0].replace('[', ''));
      const slotEnd = new Date(b.during.split(',')[1].replace(')', ''));
      const { token, tokenHash } = this.bookingPassService.generatePassToken({
        bookingId, societyId, amenityId: b.amenity_id,
        amenityName: amenityRes.rows[0]?.name_en || '',
        flatId: b.flat_id, slotStart: slotStart.toISOString(), slotEnd: slotEnd.toISOString(),
        serial: `${Date.now()}`,
      });
      await client.query(`UPDATE booking SET pass_token_hash=$2 WHERE id=$1`, [bookingId, tokenHash]);

      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type)
         VALUES ($1,$2,$3,'ADMIN','APPROVED')`,
        [societyId, bookingId, actorId],
      );

      await this.notificationsService.send({
        societyId, userId: b.booked_by,
        title: '✅ Amenity Booking Approved',
        message: 'Your booking has been approved. View your QR pass to check in.',
        type: 'SUCCESS', link: `/app/bookings/${bookingId}`,
      });

      this.gateway.emitToSociety(societyId, 'booking.slot', {
        amenityId: b.amenity_id, bookingId, status: 'CONFIRMED',
      });

      await this.auditService.append({
        societyId, actorId, actorRole: 'ADMIN',
        action: 'AMENITY_BOOKING_APPROVED', entityType: 'BOOKING', entityId: bookingId,
      });

      // Store token in event note for retrieval
      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type, note)
         VALUES ($1,$2,$3,'ADMIN','CONFIRMED',$4)`,
        [societyId, bookingId, actorId, token],
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async rejectBooking(societyId: string, actorId: string, bookingId: string, reason: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE booking SET status='REJECTED', cancel_reason=$3, cancelled_by=$4, updated_at=NOW()
         WHERE id=$1 AND society_id=$2 AND status='PENDING_APPROVAL'
         RETURNING booked_by, amenity_id, flat_id, people_count, during`,
        [bookingId, societyId, reason, actorId],
      );
      if (res.rowCount === 0) throw new BadRequestException('Booking not found or not pending approval');
      const b = res.rows[0];

      // Release CAPACITY slot
      const amenityRes = await client.query(`SELECT mode FROM amenity WHERE id = $1`, [b.amenity_id]);
      if (amenityRes.rows[0]?.mode === 'CAPACITY') {
        const slotStart = new Date(b.during.split(',')[0].replace('[', ''));
        await client.query(
          `UPDATE slot_counter SET booked_people = GREATEST(0, booked_people - $3)
           WHERE amenity_id = $1 AND slot_start = $2`,
          [b.amenity_id, slotStart, b.people_count],
        );
      }

      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type, note)
         VALUES ($1,$2,$3,'ADMIN','REJECTED',$4)`,
        [societyId, bookingId, actorId, reason],
      );

      await this.notificationsService.send({
        societyId, userId: b.booked_by,
        title: '❌ Amenity Booking Rejected',
        message: `Your booking was rejected. Reason: ${reason}`,
        type: 'WARNING', link: `/app/bookings/${bookingId}`,
      });

      await this.auditService.append({
        societyId, actorId, actorRole: 'ADMIN',
        action: 'AMENITY_BOOKING_REJECTED', entityType: 'BOOKING', entityId: bookingId,
        after: { reason },
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Cancellation ────────────────────────────────────────────────────────────

  async cancelBooking(
    societyId: string,
    actorId: string,
    bookingId: string,
    reason: string,
    isAdmin: boolean = false,
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const bookingRes = await client.query(
        `SELECT b.*, a.cancellation_free_hours, a.cancellation_fee_percent,
                a.fee_collection, a.mode, a.name_en as amenity_name
         FROM booking b
         JOIN amenity a ON b.amenity_id = a.id
         WHERE b.id = $1 AND b.society_id = $2`,
        [bookingId, societyId],
      );
      if (bookingRes.rowCount === 0) throw new NotFoundException('Booking not found');
      const b = bookingRes.rows[0];

      const cancelableStatuses = ['CONFIRMED', 'AWAITING_PAYMENT', 'PENDING_APPROVAL'];
      if (!cancelableStatuses.includes(b.status)) {
        throw new BadRequestException(`Cannot cancel a booking with status ${b.status}`);
      }

      if (!isAdmin && b.booked_by !== actorId) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }

      // Calculate cancellation fee
      const slotStart = new Date(b.during.split(',')[0].replace('[', ''));
      const hoursUntilStart = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
      const isFreeCancellation = hoursUntilStart >= b.cancellation_free_hours;
      const cancellationFeePaise = isFreeCancellation
        ? 0
        : Math.floor((b.fee_paise * b.cancellation_fee_percent) / 100);

      await client.query(
        `UPDATE booking SET status='CANCELLED', cancel_reason=$3, cancelled_by=$4, updated_at=NOW()
         WHERE id=$1 AND society_id=$2`,
        [bookingId, societyId, reason, actorId],
      );

      // Release CAPACITY slot
      if (b.mode === 'CAPACITY') {
        await client.query(
          `UPDATE slot_counter SET booked_people = GREATEST(0, booked_people - $3)
           WHERE amenity_id = $1 AND slot_start = $2`,
          [b.amenity_id, slotStart, b.people_count],
        );
      }

      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type, note)
         VALUES ($1,$2,$3,$4,'CANCELLED',$5)`,
        [societyId, bookingId, actorId, isAdmin ? 'ADMIN' : 'RESIDENT', reason],
      );

      // Notify relevant party
      if (isAdmin) {
        await this.notificationsService.send({
          societyId, userId: b.booked_by,
          title: '📅 Booking Cancelled by Admin',
          message: `Your ${b.amenity_name} booking was cancelled by management. Reason: ${reason}`,
          type: 'WARNING', link: `/app/bookings/${bookingId}`,
        });
      }

      this.gateway.emitToSociety(societyId, 'booking.slot', {
        amenityId: b.amenity_id, bookingId, status: 'CANCELLED',
      });

      await this.auditService.append({
        societyId, actorId, actorRole: isAdmin ? 'ADMIN' : 'RESIDENT',
        action: 'AMENITY_BOOKING_CANCELLED', entityType: 'BOOKING', entityId: bookingId,
        after: { reason, cancellationFeePaise, isFreeCancellation },
      });

      await client.query('COMMIT');
      return { success: true, cancellationFeePaise, isFreeCancellation };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Check-In (Guard / Attendant) ────────────────────────────────────────────

  async checkInBooking(societyId: string, actorId: string, bookingId: string, passToken?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Verify pass token if provided
      if (passToken) {
        const verifyResult = this.bookingPassService.verifyPassToken(passToken);
        if (!verifyResult.isValid || verifyResult.payload?.bookingId !== bookingId) {
          throw new ForbiddenException(verifyResult.reason || 'Invalid pass token');
        }
      }

      const res = await client.query(
        `UPDATE booking SET status='COMPLETED', checked_in_at=NOW(), updated_at=NOW()
         WHERE id=$1 AND society_id=$2 AND status='CONFIRMED'
         RETURNING booked_by, amenity_id`,
        [bookingId, societyId],
      );
      if (res.rowCount === 0) {
        throw new BadRequestException('Booking not found or not in CONFIRMED status');
      }

      await client.query(
        `INSERT INTO booking_event (society_id, booking_id, actor_id, actor_role, event_type)
         VALUES ($1,$2,$3,'GUARD','CHECKED_IN')`,
        [societyId, bookingId, actorId],
      );

      await this.auditService.append({
        societyId, actorId, actorRole: 'GUARD',
        action: 'AMENITY_BOOKING_CHECKIN', entityType: 'BOOKING', entityId: bookingId,
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async markNoShow(societyId: string, actorId: string, bookingId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `UPDATE booking SET status='NO_SHOW', updated_at=NOW()
         WHERE id=$1 AND society_id=$2 AND status='CONFIRMED'
         RETURNING booked_by`,
        [bookingId, societyId],
      );
      if (res.rowCount === 0) throw new BadRequestException('Booking not found or not CONFIRMED');

      await this.notificationsService.send({
        societyId, userId: res.rows[0].booked_by,
        title: '🚫 Booking Marked as No-Show',
        message: 'Your amenity booking was marked as no-show.',
        type: 'WARNING', link: `/app/bookings/${bookingId}`,
      });

      await this.auditService.append({
        societyId, actorId, actorRole: 'GUARD',
        action: 'AMENITY_BOOKING_NO_SHOW', entityType: 'BOOKING', entityId: bookingId,
      });
      return { success: true };
    } finally {
      client.release();
    }
  }

  // ─── My Bookings (Resident) ───────────────────────────────────────────────────

  async getMyBookings(societyId: string, flatId: string, lang: string = 'en') {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT b.id, b.status, b.fee_paise, b.deposit_paise, b.hold_expires_at,
                b.checked_in_at, b.cancel_reason, b.created_at,
                lower(b.during)::text AS slot_start, upper(b.during)::text AS slot_end,
                b.slot_count, b.people_count, b.guests_count, b.purpose,
                CASE $3 WHEN 'hi' THEN a.name_hi WHEN 'mr' THEN a.name_mr ELSE a.name_en END AS amenity_name,
                a.type AS amenity_type
         FROM booking b
         JOIN amenity a ON b.amenity_id = a.id
         WHERE b.society_id = $1 AND b.flat_id = $2
         ORDER BY b.created_at DESC
         LIMIT 100`,
        [societyId, flatId, lang],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getBookingDetail(societyId: string, bookingId: string, requestingUserId: string, isAdmin: boolean = false) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT b.*, lower(b.during)::text AS slot_start, upper(b.during)::text AS slot_end,
                a.name_en AS amenity_name, a.type AS amenity_type, a.fee_collection,
                u.full_name AS booked_by_name, f.flat_number, w.name AS wing_name
         FROM booking b
         JOIN amenity a ON b.amenity_id = a.id
         JOIN app_user u ON b.booked_by = u.id
         JOIN flat f ON b.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         WHERE b.id = $1 AND b.society_id = $2`,
        [bookingId, societyId],
      );
      if (res.rowCount === 0) throw new NotFoundException('Booking not found');
      const b = res.rows[0];

      // IDOR check: resident can only see their own flat's bookings
      if (!isAdmin && b.booked_by !== requestingUserId) {
        throw new ForbiddenException('Access denied');
      }

      // Get pass token from booking_event if CONFIRMED
      let passToken: string | null = null;
      if (['CONFIRMED', 'COMPLETED'].includes(b.status)) {
        const tokenRes = await client.query(
          `SELECT note FROM booking_event
           WHERE booking_id = $1 AND event_type = 'CONFIRMED' AND note IS NOT NULL
           ORDER BY created_at DESC LIMIT 1`,
          [bookingId],
        );
        passToken = tokenRes.rows[0]?.note || null;
      }

      return { ...b, passToken };
    } finally {
      client.release();
    }
  }

  // ─── Admin Reports ────────────────────────────────────────────────────────────

  async getAdminBookings(societyId: string, filters: any = {}) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const conditions: string[] = ['b.society_id = $1'];
      const params: any[] = [societyId];
      let idx = 2;

      if (filters.status) { conditions.push(`b.status = $${idx++}`); params.push(filters.status); }
      if (filters.amenityId) { conditions.push(`b.amenity_id = $${idx++}`); params.push(filters.amenityId); }
      if (filters.fromDate) { conditions.push(`lower(b.during) >= $${idx++}::timestamptz`); params.push(filters.fromDate); }
      if (filters.toDate) { conditions.push(`lower(b.during) <= $${idx++}::timestamptz`); params.push(filters.toDate); }

      const res = await client.query(
        `SELECT b.id, b.status, b.fee_paise, b.deposit_paise, b.created_at,
                lower(b.during)::text AS slot_start, upper(b.during)::text AS slot_end,
                b.people_count, b.guests_count, b.purpose, b.override_dues,
                a.name_en AS amenity_name, a.type AS amenity_type,
                u.full_name AS booked_by_name, f.flat_number, w.name AS wing_name
         FROM booking b
         JOIN amenity a ON b.amenity_id = a.id
         JOIN app_user u ON b.booked_by = u.id
         JOIN flat f ON b.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY b.created_at DESC
         LIMIT 500`,
        params,
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getAmenityReports(societyId: string, fromDate: string, toDate: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT
           a.id, a.name_en,
           COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED' OR b.status = 'COMPLETED') AS confirmed_count,
           COUNT(b.id) FILTER (WHERE b.status = 'NO_SHOW') AS no_show_count,
           COUNT(b.id) FILTER (WHERE b.status = 'CANCELLED') AS cancelled_count,
           SUM(b.fee_paise) FILTER (WHERE b.status IN ('CONFIRMED','COMPLETED')) AS revenue_paise,
           EXTRACT(HOUR FROM lower(b.during)) AS peak_hour
         FROM amenity a
         LEFT JOIN booking b ON a.id = b.amenity_id
           AND lower(b.during) >= $2::timestamptz
           AND lower(b.during) <= $3::timestamptz
         WHERE a.society_id = $1
         GROUP BY a.id, a.name_en, EXTRACT(HOUR FROM lower(b.during))
         ORDER BY a.name_en`,
        [societyId, fromDate, toDate],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ─── Today's bookings for Guard Console ──────────────────────────────────────

  async getTodaysBookings(societyId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT b.id, b.status, b.pass_token_hash, b.checked_in_at,
                b.people_count, b.guests_count, b.purpose,
                lower(b.during)::text AS slot_start, upper(b.during)::text AS slot_end,
                a.name_en AS amenity_name, f.flat_number, w.name AS wing_name,
                u.full_name AS booked_by_name
         FROM booking b
         JOIN amenity a ON b.amenity_id = a.id
         JOIN flat f ON b.flat_id = f.id
         JOIN wing w ON f.wing_id = w.id
         JOIN app_user u ON b.booked_by = u.id
         WHERE b.society_id = $1
           AND b.status = 'CONFIRMED'
           AND DATE(lower(b.during)) = CURRENT_DATE
         ORDER BY lower(b.during)`,
        [societyId],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ─── Blackout / Closure Management ───────────────────────────────────────────

  async addBlackout(societyId: string, actorId: string, amenityId: string, dto: any) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `INSERT INTO amenity_blackout (society_id, amenity_id, from_at, to_at, reason, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [societyId, amenityId, dto.fromAt, dto.toAt, dto.reason, actorId],
      );
      await this.auditService.append({
        societyId, actorId, actorRole: 'ADMIN',
        action: 'AMENITY_BLACKOUT_ADDED', entityType: 'AMENITY_BLACKOUT',
        entityId: res.rows[0].id, after: { amenityId, fromAt: dto.fromAt, toAt: dto.toAt },
      });
      return { id: res.rows[0].id };
    } finally {
      client.release();
    }
  }

  async getSettings(societyId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      const res = await client.query(
        `SELECT setting_key, setting_value FROM society_setting
         WHERE society_id = $1 AND setting_key IN ('block_booking_if_overdue_days')`,
        [societyId],
      );
      const settings: Record<string, string> = {
        block_booking_if_overdue_days: 'OFF',
      };
      for (const row of res.rows) {
        settings[row.setting_key] = row.setting_value;
      }
      return settings;
    } finally {
      client.release();
    }
  }

  async updateSettings(societyId: string, actorId: string, settings: { block_booking_if_overdue_days?: string }) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      if (settings.block_booking_if_overdue_days !== undefined) {
        await client.query(
          `INSERT INTO society_setting (society_id, setting_key, setting_value)
           VALUES ($1, 'block_booking_if_overdue_days', $2)
           ON CONFLICT (society_id, setting_key) DO UPDATE
           SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
          [societyId, settings.block_booking_if_overdue_days],
        );
      }
      await this.auditService.append({
        societyId, actorId, actorRole: 'ADMIN',
        action: 'AMENITY_SETTINGS_UPDATED', entityType: 'SOCIETY_SETTING',
        after: settings,
      });
      return { success: true };
    } finally {
      client.release();
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  private parseTime(timeStr: string, referenceDate: Date): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(referenceDate);
    d.setHours(h!, m!, 0, 0);
    return d;
  }

  /**
   * Post an entry to the per-flat hash-chained ledger.
   * Must be called WITHIN an open transaction.
   */
  async postLedgerEntry(
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
    const crypto = await import('crypto');
    // Get last entry for this flat
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
      societyId: params.societyId, flatId: params.flatId, seq: newSeq,
      entryType: params.entryType, direction: params.direction,
      amountPaise: params.amountPaise, refType: params.refType, refId: params.refId,
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
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id`,
      [
        params.societyId, params.flatId, newSeq, params.entryType, params.direction,
        params.amountPaise, params.refType, params.refId,
        params.reversesEntryId || null, params.narration, params.createdBy || null,
        prevHash, hash,
      ],
    );
    return { seq: newSeq, hash };
  }
}
