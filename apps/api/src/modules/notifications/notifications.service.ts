import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationPayload } from './notification-channel.interface';
import { NotificationsGateway } from './notifications.gateway';
import { EmailAdapterStub } from './adapters/email.stub';
import { SmsAdapterStub } from './adapters/sms.stub';
import { pool } from '../../database/db';

@Injectable()
export class NotificationsService implements NotificationChannel {
  name = 'IN_APP';
  private readonly logger = new Logger(NotificationsService.name);
  private emailAdapter = new EmailAdapterStub();
  private smsAdapter = new SmsAdapterStub();

  constructor(private gateway: NotificationsGateway) {}

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const client = await pool.connect();
      let insertedRow: any;

      try {
        await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

        const res = await client.query(`
          INSERT INTO in_app_notification (society_id, user_id, target_role, title, message, type, link)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `, [
          payload.societyId,
          payload.userId || null,
          payload.targetRole || null,
          payload.title,
          payload.message,
          payload.type || 'INFO',
          payload.link || null,
        ]);
        insertedRow = res.rows[0];
      } finally {
        client.release();
      }

      // Realtime push via Socket.io
      if (payload.userId) {
        this.gateway.emitToUser(payload.userId, insertedRow);
      }
      if (payload.targetRole) {
        this.gateway.emitToRole(payload.societyId, payload.targetRole, insertedRow);
      }

      // Feature-flagged stub adapters
      await this.emailAdapter.send(payload);
      await this.smsAdapter.send(payload);

      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send notification: ${err.message}`);
      return false;
    }
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    const res = await pool.query(`
      SELECT * FROM in_app_notification
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT $2;
    `, [userId, limit]);
    return res.rows;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const res = await pool.query(`
      SELECT COUNT(*) as count FROM in_app_notification
      WHERE (user_id = $1 OR user_id IS NULL) AND read = false;
    `, [userId]);
    return Number(res.rows[0]?.count || 0);
  }

  async markAsRead(id: string, userId: string) {
    await pool.query(`
      UPDATE in_app_notification
      SET read = true
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL);
    `, [id, userId]);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await pool.query(`
      UPDATE in_app_notification
      SET read = true
      WHERE user_id = $1 AND read = false;
    `, [userId]);
    return { success: true };
  }
}
