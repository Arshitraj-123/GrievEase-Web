import { NotificationChannel, NotificationPayload } from '../notification-channel.interface';
import { Logger } from '@nestjs/common';

export class EmailAdapterStub implements NotificationChannel {
  name = 'EMAIL';
  private readonly logger = new Logger(EmailAdapterStub.name);

  async send(payload: NotificationPayload): Promise<boolean> {
    const isEnabled = process.env.FEATURE_EMAIL_ADAPTER === 'true';
    if (!isEnabled) {
      this.logger.debug(`[EMAIL_STUB] Email notifications are disabled by client policy (FEATURE_EMAIL_ADAPTER=false). Dropping message: "${payload.title}"`);
      return false;
    }
    this.logger.warn(`[EMAIL_STUB] Email sending requested but no external third-party provider is configured.`);
    return false;
  }
}
