export interface NotificationPayload {
  societyId: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
}

export interface NotificationChannel {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
}
