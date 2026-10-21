import { NotificationChannel, NotificationPayload } from '../notification-channel.interface';
import { Logger } from '@nestjs/common';

export class SmsAdapterStub implements NotificationChannel {
  name = 'SMS';
  private readonly logger = new Logger(SmsAdapterStub.name);

  async send(payload: NotificationPayload): Promise<boolean> {
    const isEnabled = process.env.FEATURE_SMS_ADAPTER === 'true';
    if (!isEnabled) {
      this.logger.debug(`[SMS_STUB] SMS notifications are disabled by client policy (FEATURE_SMS_ADAPTER=false). Dropping message: "${payload.title}"`);
      return false;
    }
    this.logger.warn(`[SMS_STUB] SMS sending requested but no external third-party provider is configured.`);
    return false;
  }
}
