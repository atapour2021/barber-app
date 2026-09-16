import { Injectable } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from './notification-channel.interface';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly name = 'in_app';
  constructor(private readonly gateway: NotificationsGateway) {}
  async send(notification: Notification): Promise<void> {
    this.gateway.pushToUser(notification.userId, notification);
  }
}
