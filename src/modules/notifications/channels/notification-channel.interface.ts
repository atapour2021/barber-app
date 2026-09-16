import { Notification } from '../entities/notification.entity';

export interface NotificationChannel {
  readonly name: string;
  send(notification: Notification): Promise<void>;
}
