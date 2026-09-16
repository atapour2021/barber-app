import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationEvents } from './notifications.events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent(NotificationEvents.BOOKING_CREATED)
  async onBookingCreated(payload: { appointment: any }) {
    try {
      await this.notifications.notifyBookingCreated(payload.appointment);
    } catch (e) {
      this.logger.warn(`booking_created failed: ${String(e)}`);
    }
  }

  @OnEvent(NotificationEvents.BOOKING_CONFIRMED)
  async onBookingConfirmed(payload: { appointment: any }) {
    try {
      await this.notifications.notifyBookingConfirmed(payload.appointment);
    } catch (e) {
      this.logger.warn(`booking_confirmed failed: ${String(e)}`);
    }
  }

  @OnEvent(NotificationEvents.BOOKING_CANCELLED)
  async onBookingCancelled(payload: { appointment: any; actorId?: string }) {
    try {
      await this.notifications.notifyBookingCancelled(
        payload.appointment,
        payload.actorId,
      );
    } catch (e) {
      this.logger.warn(`booking_cancelled failed: ${String(e)}`);
    }
  }
}
