import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barber, BarberStatus } from './entities/barber.entity';
import { BarberService as BarberServiceEntity } from './entities/barber-service.entity';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { Barbershop } from '../barbershops/entities/barbershop.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const HHMM = /^\d{2}:\d{2}$/;

function assertHours(
  days?: string[],
  hours?: Record<string, { start: string; end: string }>,
) {
  if (!hours) return;
  for (const [k, v] of Object.entries(hours)) {
    const day = k.toLowerCase();
    if (!DAYS.includes(day)) throw new BadRequestException(`invalid day ${k}`);
    if (days && days.length && !days.map((d) => d.toLowerCase()).includes(day))
      throw new BadRequestException(`workingHours day ${k} not in workingDays`);
    if (!v || !HHMM.test(v.start) || !HHMM.test(v.end))
      throw new BadRequestException(`invalid time for ${k}, use HH:mm`);
    if (v.start >= v.end)
      throw new BadRequestException(`start must be before end for ${k}`);
  }
}

function assertHolidays(holidays?: string[]) {
  if (!holidays) return;
  if (new Set(holidays).size !== holidays.length)
    throw new BadRequestException('duplicate holidays');
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

function assertBreakTime(breakTime?: any, workingDays?: string[]) {
  if (!breakTime) return;
  if (isHHmmRange(breakTime)) return;
  if (typeof breakTime !== 'object')
    throw new BadRequestException('invalid breakTime');
  for (const [k, v] of Object.entries(breakTime)) {
    const day = k.toLowerCase();
    if (!DAYS.includes(day))
      throw new BadRequestException(`invalid day ${k} in breakTime`);
    if (
      workingDays &&
      workingDays.length &&
      !workingDays.map((d) => d.toLowerCase()).includes(day)
    )
      throw new BadRequestException(`breakTime day ${k} not in workingDays`);
    if (!isHHmmRange(v))
      throw new BadRequestException(
        `invalid breakTime for ${k}, use HH:mm with start < end`,
      );
  }
}

function getBreakForDay(
  breakTime: any,
  day: string,
): { start: string; end: string } | null {
  if (!breakTime) return null;
  if (isHHmmRange(breakTime)) return breakTime;
  const v = breakTime[day] || breakTime[day.toLowerCase()];
  return isHHmmRange(v) ? v : null;
}

@Injectable()
export class BarbersService {
  constructor(
    @InjectRepository(Barber) private repo: Repository<Barber>,
    @InjectRepository(BarberServiceEntity)
    private bsRepo: Repository<BarberServiceEntity>,
    @InjectRepository(Service) private svcRepo: Repository<Service>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Barbershop) private shopRepo: Repository<Barbershop>,
  ) {}

  private async syncServices(
    barberId: string,
    services?: CreateBarberDto['services'],
  ) {
    if (!services) return;
    const svcIds = services.map((s) => s.serviceId);
    if (new Set(svcIds).size !== svcIds.length)
      throw new BadRequestException('duplicate serviceId');
    for (const s of services) {
      const ex = await this.svcRepo.findOne({
        where: { id: s.serviceId },
      });
      if (!ex) throw new NotFoundException(`Service ${s.serviceId} not found`);
    }
    await this.bsRepo.delete({ barberId });
    for (const s of services)
      await this.bsRepo.save(
        this.bsRepo.create({
          barberId,
          serviceId: s.serviceId,
          price: s.price,
          duration: s.duration,
        } as any),
      );
  }

  async create(dto: CreateBarberDto, actor: any) {
    const barbershopId = dto.barbershopId;
    const targetUserId = dto.userId || actor?.id;
    if (!targetUserId) throw new BadRequestException('userId required');
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isSelf = actor?.id === targetUserId;
    if (!isAdmin && !isSelf)
      throw new ForbiddenException('cannot create barber for another user');
    const user = await this.userRepo.findOne({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('User not found');
    const shop = await this.shopRepo.findOne({
      where: { id: barbershopId },
    });
    if (!shop) throw new NotFoundException('Barbershop not found');
    const existing = await this.repo.findOne({
      where: { userId: targetUserId },
    });
    if (existing)
      throw new ConflictException(
        'Barber profile already exists for this user',
      );
    if (dto.workingDays) {
      const low = dto.workingDays.map((d) => d.toLowerCase());
      if (new Set(low).size !== low.length)
        throw new BadRequestException('duplicate workingDays');
      for (const d of low)
        if (!DAYS.includes(d))
          throw new BadRequestException(`invalid workingDay ${d}`);
    }
    assertHours(dto.workingDays, dto.workingHours);
    assertBreakTime((dto as any).breakTime, dto.workingDays);
    assertHolidays(dto.holidays);
    if (
      dto.status &&
      dto.status !== BarberStatus.ACTIVE &&
      dto.status !== BarberStatus.INACTIVE
    )
      throw new BadRequestException('status must be active|inactive');
    const barber = this.repo.create({
      fullName: dto.fullName,
      bio: dto.bio,
      profileImage: dto.profileImage,
      specialties: dto.specialties,
      workingDays: dto.workingDays?.map((d) => d.toLowerCase()),
      workingHours: dto.workingHours as any,
      breakTime: (dto as any).breakTime,
      holidays: dto.holidays,
      status: dto.status || BarberStatus.ACTIVE,
      isAvailable: dto.isAvailable ?? true,
      isActive: dto.isActive ?? true,
      barbershopId,
      userId: targetUserId,
    } as any);
    const saved = await this.repo.save(barber as any);
    await this.syncServices(saved.id, dto.services);
    if (String(user.role).toLowerCase() !== 'barber')
      await this.userRepo.update(targetUserId, { role: 'barber' });
    return this.findOne(saved.id);
  }

  async findAll(barbershopId?: string, q?: any) {
    const where: any = {};
    if (barbershopId) where.barbershopId = barbershopId;
    if (q?.isActive !== undefined)
      where.isActive = q.isActive === 'true' || q.isActive === true;
    if (q?.status) where.status = q.status;
    const hasPaging = q?.page !== undefined || q?.limit !== undefined;
    if (!hasPaging)
      return this.repo.find({
        where,
        relations: { barberServices: { service: true } },
        order: { createdAt: 'DESC' } as any,
      });
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { barberServices: { service: true } },
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({
      where: { id },
      relations: {
        barberServices: { service: true },
        barbershop: true,
        user: true,
      },
    });
    if (!e) throw new NotFoundException('Barber not found');
    return e;
  }

  async findMyBarber(userId: string) {
    const e = await this.repo.findOne({
      where: { userId },
      relations: { barberServices: { service: true } },
    });
    if (!e) throw new NotFoundException('Barber profile not found');
    return e;
  }

  async updateMyBarber(userId: string, dto: UpdateBarberDto, actor: any) {
    const me = await this.findMyBarber(userId);
    return this.update(me.id, dto, actor);
  }

  async update(id: string, dto: UpdateBarberDto, actor: any) {
    const barber = await this.findOne(id);
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin && actor?.id !== barber.userId)
      throw new ForbiddenException('not allowed to update this barber');
    if (dto.workingDays) {
      const low = dto.workingDays.map((d) => d.toLowerCase());
      if (new Set(low).size !== low.length)
        throw new BadRequestException('duplicate workingDays');
      for (const d of low)
        if (!DAYS.includes(d))
          throw new BadRequestException(`invalid workingDay ${d}`);
    }
    assertHolidays((dto as any).holidays);
    const mergedDays = (dto.workingDays ?? barber.workingDays) as any;
    assertHours(mergedDays, (dto as any).workingHours ?? barber.workingHours);
    assertBreakTime(
      (dto as any).breakTime ?? (barber as any).breakTime,
      mergedDays,
    );
    if (
      (dto as any).status &&
      (dto as any).status !== BarberStatus.ACTIVE &&
      (dto as any).status !== BarberStatus.INACTIVE
    )
      throw new BadRequestException('status must be active|inactive');
    const { services, ...rest } = dto as any;
    if (Object.keys(rest).length)
      await this.repo.update(id, {
        ...rest,
        ...(rest.workingDays
          ? {
              workingDays: rest.workingDays.map((d: string) => d.toLowerCase()),
            }
          : {}),
      });
    if (services) await this.syncServices(id, services);
    return this.findOne(id);
  }

  async remove(id: string, actor: any) {
    const barber = await this.findOne(id);
    const role = String(actor?.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin && actor?.id !== barber.userId)
      throw new ForbiddenException('not allowed to delete this barber');
    await this.repo.delete(id);
    return { deleted: true };
  }
}
