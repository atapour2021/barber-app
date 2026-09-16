import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from 'src/enums/appointment-status';
import { NotificationEvents } from '../notifications/notifications.events';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
};

const HHMM = /^\d{2}:\d{2}$/;

function toYMD(d: Date | string): string {
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

function parseHHmm(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}

function fmt(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function dayName(dateStr: string): string {
  return [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ][new Date(dateStr + 'T12:00:00.000Z').getUTCDay()];
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return d < today;
}

function isHHmmRange(v: any): boolean {
  return (
    v &&
    typeof v.start === 'string' &&
    typeof v.end === 'string' &&
    HHMM.test(v.start) &&
    HHMM.test(v.end) &&
    v.start < v.end
  );
}

function breakForDay(
  bt: any,
  day: string,
): { start: string; end: string } | null {
  if (!bt) return null;
  if (isHHmmRange(bt)) return bt;
  const v = bt[day] ?? bt[day.toLowerCase()];
  return isHHmmRange(v) ? v : null;
}

function overlaps(aS: number, aE: number, bS: number, bE: number): boolean {
  return aS < bE && aE > bS;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    private events: EventEmitter2,
  ) {}

  private async getBarberOrFail(barberId: string): Promise<Barber> {
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    if (!barber.isActive || barber.status !== 'active')
      throw new BadRequestException('Barber not available');
    return barber;
  }

  private async getServiceOrFail(
    serviceId: string,
    barberId: string,
  ): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (service.barberId !== barberId)
      throw new BadRequestException('Service does not belong to barber');
    return service;
  }

  private validateBarberAvailability(
    barber: Barber,
    dateStr: string,
    start: Date,
    end: Date,
  ) {
    const dName = dayName(dateStr);
    if (barber.workingDays && barber.workingDays.length) {
      if (!barber.workingDays.map((d) => d.toLowerCase()).includes(dName))
        throw new BadRequestException(`Barber not working on ${dName}`);
    }
    if (barber.holidays && barber.holidays.includes(dateStr))
      throw new BadRequestException('Barber on holiday');
    const wh =
      (barber.workingHours as any)?.[dName] ||
      (barber.workingHours as any)?.[dName.toLowerCase()];
    if (barber.workingHours && Object.keys(barber.workingHours).length && !wh)
      throw new BadRequestException(`No working hours for ${dName}`);
    if (wh) {
      const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
      const endMin = end.getUTCHours() * 60 + end.getUTCMinutes();
      const wStart = parseHHmm(wh.start);
      const wEnd = parseHHmm(wh.end);
      if (startMin < wStart || endMin > wEnd)
        throw new BadRequestException(
          `Slot outside working hours ${wh.start}-${wh.end}`,
        );
      const bt = breakForDay((barber as any).breakTime, dName);
      if (bt) {
        const bS = parseHHmm(bt.start);
        const bE = parseHHmm(bt.end);
        if (overlaps(startMin, endMin, bS, bE))
          throw new BadRequestException(
            `Slot overlaps break time ${bt.start}-${bt.end}`,
          );
      }
    }
  }

  private async assertNoOverlap(
    barberId: string,
    dateStr: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    const existing = await this.repo.find({
      where: {
        barberId,
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    const sameDay = existing.filter(
      (a) => toYMD(a.date) === dateStr || toYMD(a.startTime) === dateStr,
    );
    for (const a of sameDay) {
      if (excludeId && a.id === excludeId) continue;
      const s = new Date(a.startTime).getTime();
      const e = new Date(a.endTime).getTime();
      if (start.getTime() < e && end.getTime() > s)
        throw new ConflictException('Slot already booked');
    }
  }

  async availableSlots(barberId: string, dateStr: string, serviceId?: string) {
    const barber = await this.getBarberOrFail(barberId);
    if (isPastDate(dateStr))
      throw new BadRequestException('Date cannot be in the past');
    const dName = dayName(dateStr);
    if (barber.holidays?.includes(dateStr))
      return {
        date: dateStr,
        barberId,
        serviceId: serviceId || null,
        workingHours: null,
        breakTime: null,
        slots: [],
        reason: 'holiday',
      };
    if (
      barber.workingDays?.length &&
      !barber.workingDays.map((d) => d.toLowerCase()).includes(dName)
    )
      return {
        date: dateStr,
        barberId,
        serviceId: serviceId || null,
        workingHours: null,
        breakTime: null,
        slots: [],
        reason: 'not_working_day',
      };
    let duration = 30;
    if (serviceId) {
      const svc = await this.getServiceOrFail(serviceId, barberId);
      duration = svc.duration;
    }
    const wh = (barber.workingHours as any)?.[dName] ?? null;
    if (!wh || !isHHmmRange(wh))
      return {
        date: dateStr,
        barberId,
        serviceId: serviceId || null,
        workingHours: null,
        breakTime: null,
        slots: [],
        reason: 'no_working_hours',
      };
    const bt = breakForDay((barber as any).breakTime, dName);
    const wStart = parseHHmm(wh.start);
    const wEnd = parseHHmm(wh.end);
    const bStart = bt ? parseHHmm(bt.start) : null;
    const bEnd = bt ? parseHHmm(bt.end) : null;
    const existing = await this.repo.find({
      where: {
        barberId,
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    const sameDay = existing.filter(
      (a) => toYMD(a.startTime) === dateStr || toYMD(a.date) === dateStr,
    );
    const booked = sameDay.map((a) => ({
      s: new Date(a.startTime).getTime(),
      e: new Date(a.endTime).getTime(),
    }));
    const slots: Array<{
      time: string;
      startTime: string;
      endTime: string;
      status: string;
    }> = [];
    for (let m = wStart; m + duration <= wEnd; m += duration) {
      const sMin = m;
      const eMin = m + duration;
      if (
        bStart !== null &&
        bEnd !== null &&
        overlaps(sMin, eMin, bStart, bEnd)
      )
        continue;
      const start = new Date(`${dateStr}T${fmt(sMin)}:00.000Z`);
      const end = new Date(start.getTime() + duration * 60000);
      const isBooked = booked.some(
        (b) => start.getTime() < b.e && end.getTime() > b.s,
      );
      slots.push({
        time: fmt(sMin),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: isBooked ? 'Booked' : 'Available',
      });
    }
    return {
      date: dateStr,
      barberId,
      serviceId: serviceId || null,
      duration,
      workingHours: wh,
      breakTime: bt,
      slots,
    };
  }

  async create(dto: CreateAppointmentDto, actor: any) {
    if (!actor?.id) throw new BadRequestException('Unauthorized');
    const barber = await this.getBarberOrFail(dto.barberId);
    const service = await this.getServiceOrFail(dto.serviceId, dto.barberId);
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    const dateStr = dto.date.slice(0, 10);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      throw new BadRequestException('Invalid time');
    if (start >= end)
      throw new BadRequestException('startTime must be before endTime');
    if (toYMD(start) !== dateStr || toYMD(end) !== dateStr)
      throw new BadRequestException('startTime/endTime must match date');
    if (start.getTime() < Date.now() - 60000)
      throw new BadRequestException('Cannot book in the past');
    const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
    if (diffMin !== service.duration)
      throw new BadRequestException(
        `Duration must be ${service.duration} minutes`,
      );
    this.validateBarberAvailability(barber, dateStr, start, end);
    const created = await this.repo.manager.transaction(async (tx) => {
      const txRepo = tx.getRepository(Appointment);
      const existing = await txRepo.find({
        where: {
          barberId: dto.barberId,
          status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        },
      });
      const sameDay = existing.filter(
        (a) => toYMD(a.startTime) === dateStr || toYMD(a.date) === dateStr,
      );
      for (const a of sameDay) {
        const s = new Date(a.startTime).getTime();
        const e = new Date(a.endTime).getTime();
        if (start.getTime() < e && end.getTime() > s)
          throw new ConflictException('Slot already booked');
      }
      const entity = txRepo.create({
        barberId: dto.barberId,
        serviceId: dto.serviceId,
        userId: actor.id,
        date: new Date(dateStr + 'T00:00:00.000Z'),
        startTime: start,
        endTime: end,
        status: AppointmentStatus.PENDING,
        notes: dto.notes,
      } as any);
      const saved = await txRepo.save(entity as any);
      return txRepo.findOne({
        where: { id: saved.id },
        relations: { user: true, barber: true, service: true },
      });
    });
    if (created)
      this.events.emit(NotificationEvents.BOOKING_CREATED, {
        appointment: created,
      });
    return created;
  }

  async findAll(actor: any, query: any = {}) {
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isBarber = role === 'barber';
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.barberId) where.barberId = query.barberId;
    if (query.date) where.date = new Date(query.date) as any;
    if (isAdmin)
      return this.repo.find({
        where,
        relations: { user: true, barber: true, service: true },
        order: { startTime: 'ASC' } as any,
      });
    if (isBarber) {
      const myBarber = await this.barberRepo.findOne({
        where: { userId: actor.id },
      });
      if (!myBarber) throw new NotFoundException('Barber profile not found');
      where.barberId = myBarber.id;
      return this.repo.find({
        where,
        relations: { user: true, barber: true, service: true },
        order: { startTime: 'ASC' } as any,
      });
    }
    where.userId = actor.id;
    return this.repo.find({
      where,
      relations: { user: true, barber: true, service: true },
      order: { startTime: 'ASC' } as any,
    });
  }

  async findOne(id: string, actor: any) {
    const e = await this.repo.findOne({
      where: { id },
      relations: { user: true, barber: true, service: true },
    });
    if (!e) throw new NotFoundException('Appointment not found');
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (isAdmin) return e;
    if (String(actor?.id) === String(e.userId)) return e;
    const myBarber = await this.barberRepo.findOne({
      where: { userId: actor.id },
    });
    if (myBarber && myBarber.id === e.barberId) return e;
    throw new ForbiddenException('Not allowed to view this appointment');
  }

  async cancel(id: string, actor: any) {
    const e = await this.repo.findOne({
      where: { id },
      relations: { user: true, barber: true, service: true },
    });
    if (!e) throw new NotFoundException('Appointment not found');
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isOwner = String(e.userId) === String(actor.id);
    if (!isOwner && !isAdmin) {
      const myBarber = await this.barberRepo.findOne({
        where: { userId: actor.id },
      });
      if (!myBarber || myBarber.id !== e.barberId)
        throw new ForbiddenException('Not allowed to cancel');
    }
    if (
      [
        AppointmentStatus.CANCELLED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.NO_SHOW,
      ].includes(e.status as any)
    )
      throw new BadRequestException(
        `Cannot cancel appointment with status ${e.status}`,
      );
    e.status = AppointmentStatus.CANCELLED;
    await this.repo.save(e as any);
    this.events.emit(NotificationEvents.BOOKING_CANCELLED, {
      appointment: e,
      actorId: actor?.id,
    });
    return e;
  }

  async updateStatus(id: string, status: AppointmentStatus, actor: any) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Appointment not found');
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    let isBarberOwner = false;
    if (!isAdmin) {
      const myBarber = await this.barberRepo.findOne({
        where: { userId: actor.id },
      });
      if (myBarber && myBarber.id === e.barberId) isBarberOwner = true;
    }
    if (!isAdmin && !isBarberOwner)
      throw new ForbiddenException('Only barber or admin can update status');
    const allowed = ALLOWED_TRANSITIONS[e.status];
    if (!allowed || !allowed.includes(status))
      throw new BadRequestException(
        `Cannot transition from ${e.status} to ${status}`,
      );
    e.status = status;
    await this.repo.save(e as any);
    const updated = await this.repo.findOne({
      where: { id },
      relations: { user: true, barber: true, service: true },
    });
    if (updated && status === AppointmentStatus.CONFIRMED)
      this.events.emit(NotificationEvents.BOOKING_CONFIRMED, {
        appointment: updated,
      });
    if (updated && status === AppointmentStatus.CANCELLED)
      this.events.emit(NotificationEvents.BOOKING_CANCELLED, {
        appointment: updated,
        actorId: actor?.id,
      });
    return updated;
  }

  async update(id: string, dto: UpdateAppointmentDto, actor: any) {
    const e = await this.findOne(id, actor);
    const patch: any = {};
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (Object.keys(patch).length) await this.repo.update(id, patch);
    return this.repo.findOne({
      where: { id },
      relations: { user: true, barber: true, service: true },
    });
  }

  async remove(id: string, actor: any) {
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) throw new ForbiddenException('Admin only');
    await this.findOne(id, actor);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
