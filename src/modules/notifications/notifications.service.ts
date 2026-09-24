import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from 'src/enums/notification-type';
import { NotificationDispatcher } from './notifications.dispatcher';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { QueryNotificationDto } from './dto/query-notification.dto';

function fmtDate(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

function fmtTime(d: Date | string): string {
  return new Date(d).toISOString().slice(11, 16);
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
    private dispatcher: NotificationDispatcher,
  ) {}

  private async createAndDispatch(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    appointmentId?: string | null,
    data?: Record<string, any> | null,
  ): Promise<Notification> {
    if (!userId) {
      this.dispatcher['logger']?.warn?.(`skip notification ${type}: empty userId`);
      return null as any;
    }
    const entity = this.repo.create({
      userId,
      type,
      title,
      body,
      appointmentId: appointmentId ?? null,
      data: data ?? null,
      isRead: false,
    } as any);
    const saved = await this.repo.save(entity as any);
    const full = saved as Notification;
    await this.dispatcher.dispatch(full);
    return full;
  }

  async notifyBookingCreated(appointment: Appointment): Promise<void> {
    const date = fmtDate(appointment.startTime ?? appointment.date);
    const time = fmtTime(appointment.startTime);
    const barber = await this.barberRepo.findOne({
      where: { id: appointment.barberId },
    });
    const barberUserId = barber?.userId;

    await this.createAndDispatch(
      appointment.userId,
      NotificationType.BOOKING_CREATED,
      'Booking created',
      `Your booking for ${date} at ${time} is pending confirmation.`,
      appointment.id,
      { barberId: appointment.barberId, serviceId: appointment.serviceId },
    );
    if (barberUserId && barberUserId !== appointment.userId) {
      await this.createAndDispatch(
        barberUserId,
        NotificationType.BOOKING_CREATED,
        'New booking request',
        `New booking for ${date} at ${time}.`,
        appointment.id,
        { customerId: appointment.userId, barberId: appointment.barberId },
      );
    }
  }

  async notifyBookingConfirmed(appointment: Appointment): Promise<void> {
    const date = fmtDate(appointment.startTime ?? appointment.date);
    const time = fmtTime(appointment.startTime);
    await this.createAndDispatch(
      appointment.userId,
      NotificationType.BOOKING_CONFIRMED,
      'Booking confirmed',
      `Your booking for ${date} at ${time} has been confirmed.`,
      appointment.id,
      { barberId: appointment.barberId },
    );
  }

  async notifyBookingCancelled(
    appointment: Appointment,
    actorId?: string,
  ): Promise<void> {
    const date = fmtDate(appointment.startTime ?? appointment.date);
    const time = fmtTime(appointment.startTime);
    const barber = await this.barberRepo.findOne({
      where: { id: appointment.barberId },
    });
    const barberUserId = barber?.userId;
    const targets = new Set<string>();
    if (appointment.userId !== actorId) targets.add(appointment.userId);
    if (barberUserId && barberUserId !== actorId) targets.add(barberUserId);
    if (targets.size === 0) {
      targets.add(appointment.userId);
      if (barberUserId) targets.add(barberUserId);
    }
    for (const uid of targets) {
      const isCustomer = uid === appointment.userId;
      await this.createAndDispatch(
        uid,
        NotificationType.BOOKING_CANCELLED,
        'Booking cancelled',
        isCustomer
          ? `Your booking for ${date} at ${time} was cancelled.`
          : `Booking for ${date} at ${time} was cancelled.`,
        appointment.id,
        { barberId: appointment.barberId, actorId: actorId ?? null },
      );
    }
  }

  async notifyAppointmentReminder(appointment: Appointment): Promise<void> {
    if (!appointment?.userId || !String(appointment.userId).trim()) return;
    if (!appointment?.id) return;
    const date = fmtDate(appointment.startTime ?? appointment.date);
    const time = fmtTime(appointment.startTime);
    const barber = await this.barberRepo.findOne({
      where: { id: appointment.barberId },
    });
    const exists = await this.repo.findOne({
      where: {
        appointmentId: appointment.id,
        type: NotificationType.APPOINTMENT_REMINDER,
        createdAt: MoreThan(new Date(Date.now() - 22 * 60 * 60 * 1000) as any),
      },
      order: { createdAt: 'DESC' } as any,
    });
    if (exists) return;
    await this.createAndDispatch(
      appointment.userId,
      NotificationType.APPOINTMENT_REMINDER,
      'Appointment reminder',
      `Reminder: you have an appointment on ${date} at ${time}.`,
      appointment.id,
      { barberId: appointment.barberId, startTime: appointment.startTime },
    );
    if (barber?.userId && barber.userId !== appointment.userId) {
      await this.createAndDispatch(
        barber.userId,
        NotificationType.APPOINTMENT_REMINDER,
        'Appointment reminder',
        `Reminder: appointment with customer on ${date} at ${time}.`,
        appointment.id,
        { customerId: appointment.userId, startTime: appointment.startTime },
      );
    }
  }

  async sendDueReminders(repo?: Repository<Appointment>): Promise<number> {
    const r = repo ?? this.appointmentRepo;
    if (!r) return 0;
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const due = await r.find({
      where: [{ status: 'pending' }, { status: 'confirmed' }],
    });
    const inWindow = due.filter((a) => {
      if (!a?.userId || !String(a.userId).trim()) return false;
      if (!a?.startTime) return false;
      const s = new Date(a.startTime).getTime();
      if (Number.isNaN(s)) return false;
      return s > now.getTime() && s <= in24h.getTime();
    });
    let count = 0;
    for (const a of inWindow) {
      try {
        await this.notifyAppointmentReminder(a);
        count++;
      } catch (e) {
        continue;
      }
    }
    return count;
  }

  async findAll(userId: string, q: QueryNotificationDto) {
    const where: any = { userId };
    if (q.type) where.type = q.type;
    if (q.isRead !== undefined) where.isRead = q.isRead === 'true';
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const n = await this.repo.findOne({ where: { id, userId } });
    if (!n) throw new NotFoundException('Notification not found');
    if (!n.isRead) {
      n.isRead = true;
      n.readAt = new Date();
      await this.repo.save(n as any);
    }
    return n;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.repo.update(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
    return { updated: res.affected ?? 0 };
  }
}
