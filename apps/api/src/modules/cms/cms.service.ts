import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import {
  FaqItemDto,
  TestimonialSubmitDto,
  TestimonialModerateDto,
  ContactRequestDto,
  CreateConversationDto,
  SendMessageDto,
  CreateSupportTicketDto,
} from '@grievease/contracts';
import * as crypto from 'crypto';

@Injectable()
export class CmsService {
  constructor(
    private auditService: AuditService,
    private cryptoService: StaffCryptoService,
  ) {}

  // ─── FAQ Management ─────────────────────────────────────────────────────────

  async getFaqs(societyId?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM cms_faq
         WHERE (society_id = $1 OR society_id IS NULL) AND published = true
         ORDER BY sort ASC, created_at ASC`,
        [societyId || null],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getAllFaqsAdmin(societyId?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM cms_faq
         WHERE (society_id = $1 OR society_id IS NULL)
         ORDER BY sort ASC, created_at ASC`,
        [societyId || null],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async saveFaq(dto: FaqItemDto, societyId: string | null, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let res;
      if (dto.id) {
        res = await client.query(
          `UPDATE cms_faq
           SET category = $1, question_en = $2, question_hi = $3,
               answer_en = $4, answer_hi = $5, sort = $6,
               published = $7, updated_at = CURRENT_TIMESTAMP
           WHERE id = $8
           RETURNING *`,
          [
            dto.category,
            dto.question_en,
            dto.question_hi,
            dto.answer_en,
            dto.answer_hi,
            dto.sort,
            dto.published,
            dto.id,
          ],
        );
      } else {
        res = await client.query(
          `INSERT INTO cms_faq (
            society_id, category, question_en, question_hi,
            answer_en, answer_hi, sort, published
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            societyId,
            dto.category,
            dto.question_en,
            dto.question_hi,
            dto.answer_en,
            dto.answer_hi,
            dto.sort,
            dto.published,
          ],
        );
      }

      await this.auditService.append({
        societyId: societyId || '00000000-0000-0000-0000-000000000000',
        actorId,
        action: dto.id ? 'CMS_FAQ_UPDATED' : 'CMS_FAQ_CREATED',
        entityType: 'cms_faq',
        entityId: res.rows[0].id,
      });

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ─── Testimonials ──────────────────────────────────────────────────────────

  async getApprovedTestimonials(societyId?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT id, display_name, role_or_flat_label, quote, stars, photo_key, created_at
         FROM cms_testimonial
         WHERE (society_id = $1 OR $1 IS NULL) AND status = 'APPROVED'
         ORDER BY created_at DESC LIMIT 12`,
        [societyId || null],
      );

      // Rule: Landing hides testimonials until at least 3 are APPROVED
      if (res.rows.length < 3) return [];
      return res.rows;
    } finally {
      client.release();
    }
  }

  async submitTestimonial(societyId: string, userId: string, dto: TestimonialSubmitDto) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // One testimonial per active user
      const existing = await client.query(
        `SELECT id, status FROM cms_testimonial WHERE society_id = $1 AND author_user_id = $2`,
        [societyId, userId],
      );

      if (existing.rows.length > 0) {
        // Update if already submitted
        const res = await client.query(
          `UPDATE cms_testimonial
           SET display_name = $1, role_or_flat_label = $2, quote = $3,
               stars = $4, photo_key = $5, consent_to_publish = true, status = 'SUBMITTED'
           WHERE id = $6
           RETURNING *`,
          [dto.displayName, dto.roleOrFlatLabel, dto.quote, dto.stars, dto.photoKey || null, existing.rows[0].id],
        );
        return res.rows[0];
      }

      const res = await client.query(
        `INSERT INTO cms_testimonial (
          society_id, author_user_id, display_name, role_or_flat_label, quote,
          stars, photo_key, consent_to_publish, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'SUBMITTED')
        RETURNING *`,
        [
          societyId,
          userId,
          dto.displayName,
          dto.roleOrFlatLabel,
          dto.quote,
          dto.stars,
          dto.photoKey || null,
        ],
      );

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listAdminTestimonials(societyId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT t.*, u.username as author_username
         FROM cms_testimonial t
         JOIN app_user u ON t.author_user_id = u.id
         WHERE t.society_id = $1
         ORDER BY t.created_at DESC`,
        [societyId],
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async moderateTestimonial(societyId: string, actorId: string, id: string, dto: TestimonialModerateDto) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE cms_testimonial
         SET status = $1, moderated_by = $2, moderated_at = CURRENT_TIMESTAMP,
             moderation_reason = $3
         WHERE id = $4 AND society_id = $5
         RETURNING *`,
        [dto.status, actorId, dto.moderationReason || null, id, societyId],
      );

      if (res.rows.length === 0) throw new NotFoundException('Testimonial not found');

      await this.auditService.append({
        societyId,
        actorId,
        action: `CMS_TESTIMONIAL_${dto.status}`,
        entityType: 'cms_testimonial',
        entityId: id,
        after: { status: dto.status, reason: dto.moderationReason },
      });

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ─── Contact Form (PoW + Honeypot + Rate Limit) ───────────────────────────

  async submitContactRequest(dto: ContactRequestDto, ip: string) {
    // 1. Honeypot check
    if (dto.honeypot && dto.honeypot.length > 0) {
      throw new BadRequestException('Spam protection triggered.');
    }

    // 2. PoW verification check
    const hash = crypto
      .createHash('sha256')
      .update(`${dto.powNonce}:${dto.powSolution}`)
      .digest('hex');

    if (!hash.startsWith('00')) {
      throw new BadRequestException('Proof of work verification failed.');
    }

    const ipHash = crypto.createHash('sha256').update(ip || '127.0.0.1').digest('hex');
    const encryptedPhone = dto.phone ? this.cryptoService.encrypt(dto.phone) : null;

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO contact_request (
          type, name, society, role, phone_encrypted, email, message, ip_hash, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NEW')
        RETURNING id, type, name, status, created_at`,
        [
          dto.type,
          dto.name,
          dto.society || null,
          dto.role || null,
          encryptedPhone,
          dto.email || null,
          dto.message,
          ipHash,
        ],
      );

      return {
        success: true,
        requestId: res.rows[0].id,
        message: 'Your message has been received. Our society committee will review it.',
      };
    } finally {
      client.release();
    }
  }

  async listContactRequests(status?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `SELECT id, type, name, society, role, email, phone_encrypted, message, status, notes, created_at
                   FROM contact_request`;
      const params: any[] = [];
      if (status && status !== 'ALL') {
        params.push(status);
        query += ` WHERE status = $1`;
      }
      query += ` ORDER BY created_at DESC LIMIT 100`;

      const res = await client.query(query, params);
      return res.rows.map((r: any) => {
        let phone = '';
        if (r.phone_encrypted) {
          try {
            phone = this.cryptoService.decrypt(r.phone_encrypted);
          } catch {}
        }
        return { ...r, phone };
      });
    } finally {
      client.release();
    }
  }

  async updateContactRequest(id: string, actorId: string, status: string, notes?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE contact_request
         SET status = $1, notes = COALESCE($2, notes), assigned_to = $3
         WHERE id = $4
         RETURNING *`,
        [status, notes || null, actorId, id],
      );

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ─── Resident to Office Messages ──────────────────────────────────────────

  async createConversation(societyId: string, userId: string, flatId: string | null, dto: CreateConversationDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const cRes = await client.query(
        `INSERT INTO conversation (society_id, flat_id, opened_by, subject, status)
         VALUES ($1, $2, $3, $4, 'OPEN')
         RETURNING *`,
        [societyId, flatId, userId, dto.subject],
      );
      const conv = cRes.rows[0];

      await client.query(
        `INSERT INTO conversation_message (conversation_id, sender_id, sender_role, body, attachment_keys)
         VALUES ($1, $2, 'RESIDENT', $3, $4)`,
        [conv.id, userId, dto.initialMessage, dto.attachmentKeys || []],
      );

      await client.query('COMMIT');
      return conv;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listConversations(societyId: string, userId: string, isAdmin: boolean) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT c.*, f.flat_number, w.name as wing_name, u.full_name as author_name,
               (SELECT body FROM conversation_message cm WHERE cm.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_body
        FROM conversation c
        LEFT JOIN flat f ON c.flat_id = f.id
        LEFT JOIN wing w ON f.wing_id = w.id
        JOIN app_user u ON c.opened_by = u.id
        WHERE c.society_id = $1
      `;
      const params: any[] = [societyId];

      if (!isAdmin) {
        params.push(userId);
        query += ` AND c.opened_by = $${params.length}`;
      }

      query += ` ORDER BY c.last_message_at DESC`;
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getConversation(societyId: string, conversationId: string, userId: string, isAdmin: boolean) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const cRes = await client.query(
        `SELECT c.*, f.flat_number, w.name as wing_name, u.full_name as author_name
         FROM conversation c
         LEFT JOIN flat f ON c.flat_id = f.id
         LEFT JOIN wing w ON f.wing_id = w.id
         JOIN app_user u ON c.opened_by = u.id
         WHERE c.id = $1 AND c.society_id = $2`,
        [conversationId, societyId],
      );

      if (cRes.rows.length === 0) throw new NotFoundException('Conversation not found');
      const conv = cRes.rows[0];

      if (!isAdmin && conv.opened_by !== userId) {
        throw new ForbiddenException('Access denied');
      }

      const mRes = await client.query(
        `SELECT cm.*, u.full_name as sender_name
         FROM conversation_message cm
         JOIN app_user u ON cm.sender_id = u.id
         WHERE cm.conversation_id = $1
         ORDER BY cm.created_at ASC`,
        [conversationId],
      );

      return {
        ...conv,
        messages: mRes.rows,
      };
    } finally {
      client.release();
    }
  }

  async sendMessage(conversationId: string, senderId: string, senderRole: string, dto: SendMessageDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const mRes = await client.query(
        `INSERT INTO conversation_message (conversation_id, sender_id, sender_role, body, attachment_keys)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [conversationId, senderId, senderRole, dto.body, dto.attachmentKeys || []],
      );

      await client.query(
        `UPDATE conversation SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [conversationId],
      );

      await client.query('COMMIT');
      return mRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─── Support Tickets ──────────────────────────────────────────────────────

  async createSupportTicket(societyId: string, userId: string, dto: CreateSupportTicketDto) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO support_ticket (
          society_id, user_id, category, description, screenshot_keys, device_info, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'OPEN')
        RETURNING *`,
        [
          societyId,
          userId,
          dto.category,
          dto.description,
          dto.screenshotKeys || [],
          dto.deviceInfo || null,
        ],
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listSupportTickets(societyId: string, status?: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `SELECT st.*, u.full_name as user_name, u.username
                   FROM support_ticket st
                   JOIN app_user u ON st.user_id = u.id
                   WHERE st.society_id = $1`;
      const params: any[] = [societyId];
      if (status && status !== 'ALL') {
        params.push(status);
        query += ` AND st.status = $2`;
      }
      query += ` ORDER BY st.created_at DESC`;

      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async resolveSupportTicket(societyId: string, id: string, actorId: string, resolutionNote: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `UPDATE support_ticket
         SET status = 'RESOLVED', resolution_note = $1, assigned_to = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND society_id = $4
         RETURNING *`,
        [resolutionNote, actorId, id, societyId],
      );
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ─── Site Settings & Legal Texts ──────────────────────────────────────────

  async getSiteSettings(societyId: string | null) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `SELECT * FROM site_setting WHERE society_id = $1 OR society_id IS NULL`,
        [societyId],
      );

      const map: Record<string, any> = {};
      for (const row of res.rows) {
        map[row.key] = {
          en: row.value_en,
          hi: row.value_hi,
          json: row.json_value,
        };
      }
      return map;
    } finally {
      client.release();
    }
  }

  async updateSiteSetting(societyId: string | null, key: string, payload: any, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(
        `INSERT INTO site_setting (key, society_id, value_en, value_hi, json_value, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (key, society_id) DO UPDATE
         SET value_en = EXCLUDED.value_en,
             value_hi = EXCLUDED.value_hi,
             json_value = EXCLUDED.json_value,
             updated_by = EXCLUDED.updated_by,
             updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          key,
          societyId,
          payload.en || null,
          payload.hi || null,
          payload.json ? JSON.stringify(payload.json) : null,
          actorId,
        ],
      );

      await this.auditService.append({
        societyId: societyId || '00000000-0000-0000-0000-000000000000',
        actorId,
        action: 'SITE_SETTING_UPDATED',
        entityType: 'site_setting',
        entityId: key,
        after: payload,
      });

      return res.rows[0];
    } finally {
      client.release();
    }
  }
}
