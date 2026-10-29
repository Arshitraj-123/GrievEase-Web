import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { pool } from '../../database/db';
import { AuditService } from '../audit/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AppStorageService } from '../storage/storage.service';
import { sanitizeNoticeHtml } from './notice-sanitizer';
import {
  CreateNoticeDto,
  UpdateNoticeDto,
  NoticeListItemDto,
  NoticeDetailDto,
  NoticeReaderStatsDto,
  NoticeCategoryDto,
} from '@grievease/contracts';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class NoticesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NoticesService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    private auditService: AuditService,
    private gateway: NotificationsGateway,
    private storageService: AppStorageService
  ) {}

  async onModuleInit() {
    this.initQueueAndWorker();
    // Hourly sweep for scheduled publications and auto-archiving expired notices
    this.sweepTimer = setInterval(() => {
      this.runPeriodicSweep().catch((err) =>
        this.logger.error(`Periodic notice sweep failed: ${err.message}`)
      );
    }, 60 * 1000); // Check every minute in dev/prod
  }

  async onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }

  private initQueueAndWorker() {
    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || 'local_redis_secret_replace_in_prod';
      const connection = new IORedis({
        host,
        port,
        password,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      this.queue = new Queue('notice-publish-queue', { connection });
      this.worker = new Worker(
        'notice-publish-queue',
        async (job) => {
          if (job.name === 'publish-notice') {
            await this.publishNoticeDirect(job.data.noticeId, job.data.societyId, job.data.userId);
          }
        },
        { connection }
      );
      this.logger.log('📢 Notice BullMQ queue and worker initialized successfully.');
    } catch (err: any) {
      this.logger.warn(`Notice Queue initialization skipped (Redis unavailable): ${err.message}`);
    }
  }

  /**
   * Run periodic sweep: publish due scheduled notices and archive expired notices
   */
  async runPeriodicSweep() {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // 1. Publish scheduled notices whose publish_at has arrived
      const dueRes = await client.query(`
        SELECT id, society_id, created_by FROM notice
        WHERE status = 'SCHEDULED' AND publish_at <= NOW();
      `);

      for (const row of dueRes.rows) {
        await this.publishNoticeDirect(row.id, row.society_id, row.created_by);
      }

      // 2. Auto-archive notices whose expires_at has passed
      await client.query(`
        UPDATE notice
        SET status = 'ARCHIVED', updated_at = NOW()
        WHERE status = 'PUBLISHED' AND expires_at IS NOT NULL AND expires_at <= NOW();
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Seed default system categories for a society if none exist
   */
  async ensureDefaultCategories(societyId: string): Promise<NoticeCategoryDto[]> {
    const defaultCategories = [
      { en: 'General', hi: 'सामान्य', mr: 'सामान्य' },
      { en: 'Maintenance', hi: 'रखरखाव', mr: 'देखभाल' },
      { en: 'Meeting / AGM', hi: 'बैठक / एजीएम', mr: 'बैठक / एजीएम' },
      { en: 'Water & Power Shutoff', hi: 'पानी और बिजली कटौती', mr: 'पाणी आणि वीज खंडित' },
      { en: 'Community Events', hi: 'सामुदायिक कार्यक्रम', mr: 'सामुदायिक कार्यक्रम' },
      { en: 'Society Rules', hi: 'सोसायटी नियम', mr: 'सोसायटीचे नियम' },
      { en: 'Emergency Notices', hi: 'आपातकालीन सूचना', mr: 'तातडीच्या सूचना' },
    ];

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      for (const [i, c] of defaultCategories.entries()) {
        if (!c) continue;
        await client.query(`
          INSERT INTO notice_category (society_id, name_en, name_hi, name_mr, is_system, sort_order)
          VALUES ($1, $2, $3, $4, true, $5)
          ON CONFLICT (society_id, name_en) DO NOTHING;
        `, [societyId, c.en, c.hi, c.mr, i]);
      }

      const res = await client.query(`
        SELECT id, name_en as "nameEn", name_hi as "nameHi", name_mr as "nameMr",
               is_system as "isSystem", sort_order as "sortOrder"
        FROM notice_category
        WHERE society_id = $1
        ORDER BY sort_order ASC;
      `, [societyId]);

      return res.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new notice
   */
  async createNotice(
    societyId: string,
    userId: string,
    dto: CreateNoticeDto
  ): Promise<{ id: string; status: string }> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Check max pinned notices constraint if pinned is requested
      if (dto.pinned) {
        const settingRes = await client.query(`
          SELECT setting_value FROM society_setting
          WHERE society_id = $1 AND setting_key = 'max_pinned_notices';
        `, [societyId]);
        const maxPinned = settingRes.rows.length > 0 ? Number(settingRes.rows[0].setting_value) : 3;

        const currentPinnedRes = await client.query(`
          SELECT COUNT(*)::int as count FROM notice
          WHERE society_id = $1 AND pinned = true AND status = 'PUBLISHED';
        `, [societyId]);

        if (currentPinnedRes.rows[0].count >= maxPinned) {
          throw new BadRequestException(
            `Society has reached the maximum limit of ${maxPinned} pinned notices. Unpin an existing notice first.`
          );
        }
      }

      const cleanBody = sanitizeNoticeHtml(dto.body);
      const isScheduled = dto.publishAt && new Date(dto.publishAt) > new Date();
      const initialStatus = isScheduled ? 'SCHEDULED' : 'PUBLISHED';
      const publishedAt = initialStatus === 'PUBLISHED' ? new Date().toISOString() : null;

      const noticeRes = await client.query(`
        INSERT INTO notice (
          society_id, category_id, title, body, status, priority,
          pinned, pin_order, audience_type, publish_at, expires_at,
          requires_ack, created_by, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id;
      `, [
        societyId,
        dto.categoryId,
        dto.title.trim(),
        cleanBody,
        initialStatus,
        dto.priority,
        dto.pinned,
        dto.pinOrder || 0,
        dto.audienceType,
        dto.publishAt ? new Date(dto.publishAt) : null,
        dto.expiresAt ? new Date(dto.expiresAt) : null,
        dto.requiresAck,
        userId,
        publishedAt,
      ]);

      const noticeId = noticeRes.rows[0].id;

      // Translations
      if (dto.translations?.hi) {
        await client.query(`
          INSERT INTO notice_translation (notice_id, lang, title, body)
          VALUES ($1, 'hi', $2, $3)
          ON CONFLICT (notice_id, lang) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
        `, [noticeId, dto.translations.hi.title.trim(), sanitizeNoticeHtml(dto.translations.hi.body)]);
      }
      if (dto.translations?.mr) {
        await client.query(`
          INSERT INTO notice_translation (notice_id, lang, title, body)
          VALUES ($1, 'mr', $2, $3)
          ON CONFLICT (notice_id, lang) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
        `, [noticeId, dto.translations.mr.title.trim(), sanitizeNoticeHtml(dto.translations.mr.body)]);
      }

      // Audience targeting
      if (dto.audienceType === 'WINGS' && dto.targetWingIds?.length) {
        for (const wingId of dto.targetWingIds) {
          await client.query(`
            INSERT INTO notice_audience (notice_id, wing_id) VALUES ($1, $2);
          `, [noticeId, wingId]);
        }
      } else if (dto.audienceType === 'ROLES' && dto.targetRoles?.length) {
        for (const role of dto.targetRoles) {
          await client.query(`
            INSERT INTO notice_audience (notice_id, role) VALUES ($1, $2);
          `, [noticeId, role]);
        }
      }

      // Attachments
      if (dto.attachmentKeys?.length) {
        for (const storageKey of dto.attachmentKeys) {
          const fileName = storageKey.split('/').pop() || 'attachment';
          await client.query(`
            INSERT INTO notice_attachment (notice_id, storage_key, file_name, mime, size, sha256)
            VALUES ($1, $2, $3, $4, $5, $6);
          `, [noticeId, storageKey, fileName, 'application/octet-stream', 0, 'pending']);
        }
      }

      // Audit Log
      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: initialStatus === 'PUBLISHED' ? 'NOTICE_PUBLISHED' : 'NOTICE_SCHEDULED',
        entityType: 'NOTICE',
        entityId: noticeId,
        after: { title: dto.title, priority: dto.priority, status: initialStatus },
      });

      // If scheduled, register BullMQ delayed job
      if (isScheduled && this.queue) {
        const delayMs = Math.max(0, new Date(dto.publishAt!).getTime() - Date.now());
        await this.queue.add(
          'publish-notice',
          { noticeId, societyId, userId },
          { delay: delayMs }
        );
      }

      // If published immediately, perform notification fan-out
      if (initialStatus === 'PUBLISHED') {
        this.fanOutNoticeNotifications(societyId, noticeId, dto.title, dto.priority).catch((err) =>
          this.logger.error(`Fan-out failed: ${err.message}`)
        );
      }

      return { id: noticeId, status: initialStatus };
    } finally {
      client.release();
    }
  }

  /**
   * Edit an existing notice with version tracking
   */
  async updateNotice(
    societyId: string,
    userId: string,
    noticeId: string,
    dto: UpdateNoticeDto
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const prevRes = await client.query(`
        SELECT * FROM notice WHERE id = $1 AND society_id = $2;
      `, [noticeId, societyId]);

      if (prevRes.rows.length === 0) {
        throw new NotFoundException('Notice not found');
      }

      const prev = prevRes.rows[0];

      // If already published, require an edit reason and store append-only notice_version
      if (prev.status === 'PUBLISHED') {
        if (!dto.editReason) {
          throw new BadRequestException('An edit reason is required when modifying a published notice.');
        }

        const countRes = await client.query(`
          SELECT COUNT(*)::int as count FROM notice_version WHERE notice_id = $1;
        `, [noticeId]);
        const nextVersion = countRes.rows[0].count + 1;

        await client.query(`
          INSERT INTO notice_version (notice_id, version_num, title, body, edited_by, reason)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [noticeId, nextVersion, prev.title, prev.body, userId, dto.editReason]);
      }

      const cleanBody = sanitizeNoticeHtml(dto.body);

      await client.query(`
        UPDATE notice
        SET category_id = $1, title = $2, body = $3, priority = $4,
            pinned = $5, pin_order = $6, audience_type = $7,
            expires_at = $8, requires_ack = $9, updated_at = NOW()
        WHERE id = $10 AND society_id = $11;
      `, [
        dto.categoryId,
        dto.title.trim(),
        cleanBody,
        dto.priority,
        dto.pinned,
        dto.pinOrder || 0,
        dto.audienceType,
        dto.expiresAt ? new Date(dto.expiresAt) : null,
        dto.requiresAck,
        noticeId,
        societyId,
      ]);

      // Update translations
      if (dto.translations?.hi) {
        await client.query(`
          INSERT INTO notice_translation (notice_id, lang, title, body)
          VALUES ($1, 'hi', $2, $3)
          ON CONFLICT (notice_id, lang) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
        `, [noticeId, dto.translations.hi.title.trim(), sanitizeNoticeHtml(dto.translations.hi.body)]);
      }
      if (dto.translations?.mr) {
        await client.query(`
          INSERT INTO notice_translation (notice_id, lang, title, body)
          VALUES ($1, 'mr', $2, $3)
          ON CONFLICT (notice_id, lang) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
        `, [noticeId, dto.translations.mr.title.trim(), sanitizeNoticeHtml(dto.translations.mr.body)]);
      }

      // Audit Log
      await this.auditService.append({
        societyId,
        actorId: userId,
        actorRole: 'ADMIN',
        action: 'NOTICE_EDITED',
        entityType: 'NOTICE',
        entityId: noticeId,
        before: { title: prev.title },
        after: { title: dto.title, reason: dto.editReason },
      });

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Directly publish a notice (called by worker or immediate publish)
   */
  async publishNoticeDirect(noticeId: string, societyId: string, actorUserId: string) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        UPDATE notice
        SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND society_id = $2
        RETURNING title, priority;
      `, [noticeId, societyId]);

      if (res.rows.length > 0) {
        const { title, priority } = res.rows[0];
        await this.auditService.append({
          societyId,
          actorId: actorUserId,
          actorRole: 'SYSTEM_WORKER',
          action: 'NOTICE_PUBLISHED_AUTOMATIC',
          entityType: 'NOTICE',
          entityId: noticeId,
          after: { title, priority },
        });

        await this.fanOutNoticeNotifications(societyId, noticeId, title, priority);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Fast asynchronous batch fan-out (handles 2,000+ residents under 10 seconds)
   */
  private async fanOutNoticeNotifications(
    societyId: string,
    noticeId: string,
    title: string,
    priority: string
  ) {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Fetch all eligible active residents in the society
      const usersRes = await client.query(`
        SELECT id FROM app_user
        WHERE society_id = $1 AND status = 'ACTIVE';
      `, [societyId]);

      const users = usersRes.rows;
      if (users.length === 0) return;

      const batchSize = 500;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const values: any[] = [];
        const placeholders: string[] = [];

        batch.forEach((u, idx) => {
          const offset = idx * 6;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
          values.push(
            societyId,
            u.id,
            `Notice: ${title}`,
            `New ${priority.toLowerCase()} notice has been posted to the society noticeboard.`,
            priority === 'EMERGENCY' ? 'EMERGENCY' : 'INFO',
            `/app/notices/${noticeId}`
          );
        });

        await client.query(`
          INSERT INTO in_app_notification (society_id, user_id, title, message, type, link)
          VALUES ${placeholders.join(', ')};
        `, values);
      }

      // Emit live Socket.io event to society room
      if (priority === 'EMERGENCY') {
        this.gateway.emitToSociety(societyId, 'notice:emergency', {
          noticeId,
          title,
          priority: 'EMERGENCY',
        });
      } else {
        this.gateway.emitToSociety(societyId, 'notice:published', {
          noticeId,
          title,
          priority,
        });
      }
    } finally {
      client.release();
    }
  }

  /**
   * Mark notice as read by resident
   */
  async markRead(_societyId: string, userId: string, noticeId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query(`
        INSERT INTO notice_read (notice_id, user_id, read_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (notice_id, user_id) DO NOTHING;
      `, [noticeId, userId]);
      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Explicitly acknowledge a notice
   */
  async acknowledgeNotice(_societyId: string, userId: string, noticeId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");
      await client.query(`
        INSERT INTO notice_read (notice_id, user_id, read_at, acknowledged_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (notice_id, user_id)
        DO UPDATE SET acknowledged_at = NOW();
      `, [noticeId, userId]);
      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Resident Notice List query (with EN/HI/MR translation fallback and read tracking)
   */
  async getNoticesForResident(
    societyId: string,
    userId: string,
    userLang: string = 'en',
    filters: { tab?: 'all' | 'unread' | 'pinned'; categoryId?: string; search?: string } = {}
  ): Promise<NoticeListItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      let query = `
        SELECT
          n.id,
          COALESCE(nt.title, n.title) as "title",
          SUBSTRING(REGEXP_REPLACE(COALESCE(nt.body, n.body), '<[^>]+>', '', 'g'), 1, 160) as "bodyPreview",
          n.category_id as "categoryId",
          nc.name_en as "categoryName",
          n.priority,
          n.status,
          n.pinned,
          n.pin_order as "pinOrder",
          n.audience_type as "audienceType",
          n.publish_at::text as "publishAt",
          n.expires_at::text as "expiresAt",
          n.requires_ack as "requiresAck",
          (nr.read_at IS NOT NULL) as "isRead",
          (nr.acknowledged_at IS NOT NULL) as "isAcknowledged",
          n.published_at::text as "publishedAt",
          n.created_at::text as "createdAt",
          (SELECT COUNT(*) FROM notice_version nv WHERE nv.notice_id = n.id) > 0 as "hasEdits",
          (SELECT COUNT(*)::int FROM notice_attachment na WHERE na.notice_id = n.id) as "attachmentCount"
        FROM notice n
        JOIN notice_category nc ON n.category_id = nc.id
        LEFT JOIN notice_translation nt ON n.id = nt.notice_id AND nt.lang = $2
        LEFT JOIN notice_read nr ON n.id = nr.notice_id AND nr.user_id = $3
        WHERE n.society_id = $1 AND n.status = 'PUBLISHED'
      `;
      const params: any[] = [societyId, userLang, userId];

      if (filters.tab === 'pinned') {
        query += ` AND n.pinned = true`;
      } else if (filters.tab === 'unread') {
        query += ` AND nr.read_at IS NULL`;
      }

      if (filters.categoryId) {
        params.push(filters.categoryId);
        query += ` AND n.category_id = $${params.length}`;
      }

      if (filters.search) {
        params.push(`%${filters.search.trim()}%`);
        query += ` AND (n.title ILIKE $${params.length} OR n.body ILIKE $${params.length})`;
      }

      // Ordering: EMERGENCY first, then Pinned (by pin_order), then published_at DESC
      query += `
        ORDER BY
          CASE WHEN n.priority = 'EMERGENCY' AND nr.acknowledged_at IS NULL THEN 0 ELSE 1 END,
          n.pinned DESC,
          n.pin_order ASC,
          n.published_at DESC;
      `;

      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get single notice detail
   */
  async getNoticeDetail(
    societyId: string,
    userId: string,
    noticeId: string,
    userLang: string = 'en'
  ): Promise<NoticeDetailDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const noticeRes = await client.query(`
        SELECT
          n.id,
          COALESCE(nt.title, n.title) as "title",
          COALESCE(nt.body, n.body) as "body",
          SUBSTRING(REGEXP_REPLACE(COALESCE(nt.body, n.body), '<[^>]+>', '', 'g'), 1, 160) as "bodyPreview",
          n.category_id as "categoryId",
          nc.name_en as "categoryName",
          n.priority,
          n.status,
          n.pinned,
          n.pin_order as "pinOrder",
          n.audience_type as "audienceType",
          n.publish_at::text as "publishAt",
          n.expires_at::text as "expiresAt",
          n.requires_ack as "requiresAck",
          (nr.read_at IS NOT NULL) as "isRead",
          (nr.acknowledged_at IS NOT NULL) as "isAcknowledged",
          n.published_at::text as "publishedAt",
          n.created_at::text as "createdAt",
          u.full_name as "createdByName"
        FROM notice n
        JOIN notice_category nc ON n.category_id = nc.id
        JOIN app_user u ON n.created_by = u.id
        LEFT JOIN notice_translation nt ON n.id = nt.notice_id AND nt.lang = $2
        LEFT JOIN notice_read nr ON n.id = nr.notice_id AND nr.user_id = $3
        WHERE n.id = $4 AND n.society_id = $1;
      `, [societyId, userLang, userId, noticeId]);

      if (noticeRes.rows.length === 0) {
        throw new NotFoundException('Notice not found');
      }

      // Mark read automatically
      await this.markRead(societyId, userId, noticeId);

      const notice = noticeRes.rows[0];

      // Fetch attachments
      const attachRes = await client.query(`
        SELECT id, file_name as "fileName", mime, size, storage_key as "storageKey"
        FROM notice_attachment
        WHERE notice_id = $1;
      `, [noticeId]);

      const attachments = await Promise.all(
        attachRes.rows.map(async (a) => ({
          id: a.id,
          fileName: a.fileName,
          mime: a.mime,
          size: a.size,
          downloadUrl: await this.storageService.getDownloadUrl(a.storageKey, 3600),
        }))
      );

      // Fetch version history
      const versRes = await client.query(`
        SELECT nv.version_num as "versionNum", nv.title, nv.body,
               u.full_name as "editedByName", nv.reason, nv.created_at::text as "createdAt"
        FROM notice_version nv
        JOIN app_user u ON nv.edited_by = u.id
        WHERE nv.notice_id = $1
        ORDER BY nv.version_num DESC;
      `, [noticeId]);

      return {
        ...notice,
        hasEdits: versRes.rows.length > 0,
        attachmentCount: attachments.length,
        attachments,
        versions: versRes.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Admin Notice Reader statistics (who read, who acknowledged, unread flats list)
   */
  async getNoticeReaderStats(societyId: string, noticeId: string): Promise<NoticeReaderStatsDto> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      // Total targeted flats / residents
      const totalRes = await client.query(`
        SELECT COUNT(DISTINCT u.id)::int as total
        FROM app_user u
        WHERE u.society_id = $1 AND u.status = 'ACTIVE';
      `, [societyId]);
      const totalTargeted = totalRes.rows[0]?.total || 0;

      const readsRes = await client.query(`
        SELECT
          COUNT(DISTINCT user_id)::int as "readCount",
          COUNT(DISTINCT CASE WHEN acknowledged_at IS NOT NULL THEN user_id END)::int as "ackCount"
        FROM notice_read
        WHERE notice_id = $1;
      `, [noticeId]);

      const readCount = readsRes.rows[0]?.readCount || 0;
      const acknowledgedCount = readsRes.rows[0]?.ackCount || 0;

      // Flats that have NOT read yet (Admin view: flats only, no resident names)
      const unreadFlatsRes = await client.query(`
        SELECT DISTINCT f.id as "flatId", f.flat_number as "flatNumber", w.name as "wingName"
        FROM flat f
        JOIN wing w ON f.wing_id = w.id
        JOIN app_user u ON u.flat_id = f.id
        WHERE f.society_id = $1 AND u.status = 'ACTIVE'
          AND f.id NOT IN (
            SELECT DISTINCT u2.flat_id
            FROM notice_read nr
            JOIN app_user u2 ON nr.user_id = u2.id
            WHERE nr.notice_id = $2 AND u2.flat_id IS NOT NULL
          )
        ORDER BY w.name, f.flat_number
        LIMIT 100;
      `, [societyId, noticeId]);

      // Flats that have NOT acknowledged yet
      const unackFlatsRes = await client.query(`
        SELECT DISTINCT f.id as "flatId", f.flat_number as "flatNumber", w.name as "wingName"
        FROM flat f
        JOIN wing w ON f.wing_id = w.id
        JOIN app_user u ON u.flat_id = f.id
        WHERE f.society_id = $1 AND u.status = 'ACTIVE'
          AND f.id NOT IN (
            SELECT DISTINCT u2.flat_id
            FROM notice_read nr
            JOIN app_user u2 ON nr.user_id = u2.id
            WHERE nr.notice_id = $2 AND nr.acknowledged_at IS NOT NULL AND u2.flat_id IS NOT NULL
          )
        ORDER BY w.name, f.flat_number
        LIMIT 100;
      `, [societyId, noticeId]);

      return {
        noticeId,
        totalTargeted,
        readCount,
        acknowledgedCount,
        unreadFlats: unreadFlatsRes.rows,
        unacknowledgedFlats: unackFlatsRes.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Admin list notices (all statuses: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED)
   */
  async getAdminNotices(societyId: string): Promise<NoticeListItemDto[]> {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      const res = await client.query(`
        SELECT
          n.id,
          n.title,
          SUBSTRING(REGEXP_REPLACE(n.body, '<[^>]+>', '', 'g'), 1, 160) as "bodyPreview",
          n.category_id as "categoryId",
          nc.name_en as "categoryName",
          n.priority,
          n.status,
          n.pinned,
          n.pin_order as "pinOrder",
          n.audience_type as "audienceType",
          n.publish_at::text as "publishAt",
          n.expires_at::text as "expiresAt",
          n.requires_ack as "requiresAck",
          false as "isRead",
          false as "isAcknowledged",
          n.published_at::text as "publishedAt",
          n.created_at::text as "createdAt",
          (SELECT COUNT(*) FROM notice_version nv WHERE nv.notice_id = n.id) > 0 as "hasEdits",
          (SELECT COUNT(*)::int FROM notice_attachment na WHERE na.notice_id = n.id) as "attachmentCount"
        FROM notice n
        JOIN notice_category nc ON n.category_id = nc.id
        WHERE n.society_id = $1
        ORDER BY n.created_at DESC;
      `, [societyId]);

      return res.rows;
    } finally {
      client.release();
    }
  }
}
