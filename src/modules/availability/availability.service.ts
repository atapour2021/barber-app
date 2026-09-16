import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentStatus } from 'src/enums/appointment-status';
import { SlotStatus } from './dto/get-availability.dto';

const HHMM = /^\d{2}:\d{2}$/;

function toYMD(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
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
  return new Date(dateStr + 'T00:00:00.000Z') < today;
}
function parseHHmm(v: string): number {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}
function fmt(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
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
export class AvailabilityService {
  constructor(
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Appointment) private apptRepo: Repository<Appointment>,
  ) {}

  async getAvailability(barberId: string, dateStr: string, serviceId?: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
      throw new BadRequestException('date must be YYYY-MM-DD');
    if (isPastDate(dateStr))
      throw new BadRequestException('Date cannot be in the past');

    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    if (!barber.isActive || barber.status !== 'active')
      throw new BadRequestException('Barber not available');

    const dName = dayName(dateStr);
    if (barber.holidays?.includes(dateStr)) {
      return {
        date: dateStr,
        barberId,
        serviceId: serviceId || null,
        workingHours: null,
        breakTime: null,
        slots: [],
        reason: 'holiday',
      };
    }
    if (
      barber.workingDays?.length &&
      !barber.workingDays.map((d) => d.toLowerCase()).includes(dName)
    ) {
      return {
        date: dateStr,
        barberId,
        serviceId: serviceId || null,
        workingHours: null,
        breakTime: null,
        slots: [],
        reason: 'not_working_day',
      };
    }

    let duration = 30;
    if (serviceId) {
      const svc = await this.serviceRepo.findOne({ where: { id: serviceId } });
      if (!svc) throw new NotFoundException('Service not found');
      if (svc.barberId !== barberId)
        throw new BadRequestException('Service does not belong to barber');
      duration = svc.duration;
    }

    const wh = (barber.workingHours as any)?.[dName] ?? null;
    if (!wh || !isHHmmRange(wh)) {
      return {
        date: dateStr,
        barberId,
        serviceId: serviceId || null,
        workingHours: null,
        breakTime: null,
        slots: [],
        reason: 'no_working_hours',
      };
    }
    const bt = breakForDay((barber as any).breakTime, dName);
    const wStart = parseHHmm(wh.start);
    const wEnd = parseHHmm(wh.end);
    const bStart = bt ? parseHHmm(bt.start) : null;
    const bEnd = bt ? parseHHmm(bt.end) : null;

    const existing = await this.apptRepo.find({
      where: {
        barberId,
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    const booked = existing
      .filter(
        (a) => toYMD(a.startTime) === dateStr || toYMD(a.date) === dateStr,
      )
      .map((a) => ({
        s: new Date(a.startTime).getTime(),
        e: new Date(a.endTime).getTime(),
      }));

    const slots: Array<{
      time: string;
      startTime: string;
      endTime: string;
      status: SlotStatus;
    }> = [];
    for (let m = wStart; m + duration <= wEnd; m += duration) {
      const sMin = m;
      const eMin = m + duration;
      const inBreak =
        bStart !== null && bEnd !== null && overlaps(sMin, eMin, bStart, bEnd);
      if (inBreak) continue;
      const start = new Date(`${dateStr}T${fmt(sMin)}:00.000Z`);
      const end = new Date(start.getTime() + duration * 60000);
      const isBooked = booked.some(
        (b) => start.getTime() < b.e && end.getTime() > b.s,
      );
      slots.push({
        time: fmt(sMin),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: isBooked ? SlotStatus.Booked : SlotStatus.Available,
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
}
