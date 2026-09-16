import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { NotificationChannel } from './channels/notification-channel.interface';
import { NOTIFICATION_CHANNELS } from './notifications.constants';

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: NotificationChannel[],
  ) {}
  async dispatch(notification: Notification): Promise<void> {
    const results = await Promise.allSettled(
      this.channels.map((c) => c.send(notification)),
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected')
        this.logger.warn(
          `channel ${this.channels[i].name} failed: ${String(r.reason)}`,
        );
    }
  }
}
