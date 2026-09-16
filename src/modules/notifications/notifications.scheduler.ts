import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), 60 * 60 * 1000);
    this.timer.unref?.();
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    try {
      const count = await this.notifications.sendDueReminders(
        this.appointmentRepo as any,
      );
      if (count) this.logger.log(`sent ${count} reminder(s)`);
    } catch (e) {
      this.logger.warn(`reminder tick failed: ${String(e)}`);
    }
  }
}
