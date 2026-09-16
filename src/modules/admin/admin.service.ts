import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Barber, BarberStatus } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Setting } from './entities/setting.entity';
import {
  AdminUpdateUserDto,
  AdminUpdateSettingDto,
  CreateSettingDto,
} from './dto/update-user.dto';
import { AppointmentStatus } from '../../enums/appointment-status';

const ALLOWED: Record<string, string[]> = {
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

function sanitize(u: User) {
  const { password, ...r } = u as any;
  return r;
}
function meta(total: number, page: number, limit: number) {
  return { total, page, limit, pages: Math.ceil(total / limit) };
}
function pageLimit(q: any) {
  return {
    page: Math.max(1, Number(q.page) || 1),
    limit: Math.min(100, Math.max(1, Number(q.limit) || 20)),
  };
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Barber) private barbers: Repository<Barber>,
    @InjectRepository(Service) private services: Repository<Service>,
    @InjectRepository(Appointment)
    private appointments: Repository<Appointment>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
  ) {}

  async dashboard() {
    const [totalUsers, totalBarbers, totalServices, totalAppointments] =
      await Promise.all([
        this.users.count(),
        this.barbers.count(),
        this.services.count(),
        this.appointments.count(),
      ]);
    const totalCustomers = await this.users.count({
      where: { role: In(['customer', 'CUSTOMER', 'user', 'USER']) },
    });
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      this.appointments.count({ where: { status: AppointmentStatus.PENDING } }),
      this.appointments.count({
        where: { status: AppointmentStatus.CONFIRMED },
      }),
      this.appointments.count({
        where: { status: AppointmentStatus.COMPLETED },
      }),
      this.appointments.count({
        where: { status: AppointmentStatus.CANCELLED },
      }),
    ]);
    const d = new Date().toISOString().slice(0, 10);
    const todayAppointments = await this.appointments.count({
      where: {
        startTime: Between(
          new Date(d + 'T00:00:00.000Z') as any,
          new Date(d + 'T23:59:59.999Z') as any,
        ),
      },
    });
    const activeBarbers = await this.barbers.count({
      where: { isActive: true, status: BarberStatus.ACTIVE },
    });
    const completedAppts = await this.appointments.find({
      where: { status: AppointmentStatus.COMPLETED },
      relations: { service: true },
    });
    const revenue = completedAppts.reduce(
      (s, a: any) => s + Number(a.service?.price || 0),
      0,
    );
    return {
      totalUsers,
      totalCustomers,
      totalBarbers,
      activeBarbers,
      totalServices,
      totalAppointments,
      pending,
      confirmed,
      completed,
      cancelled,
      todayAppointments,
      revenue: Math.round(revenue * 100) / 100,
    };
  }

  async listUsers(q: any) {
    const { page, limit } = pageLimit(q);
    const search = (q.search || '').trim();
    const qb = this.users.createQueryBuilder('u');
    let hasWhere = false;
    if (search) {
      qb.where(
        '(u.username LIKE :s OR u.name LIKE :s OR u.family LIKE :s OR u.nationalCode LIKE :s OR u.email LIKE :s)',
        { s: `%${search}%` },
      );
      hasWhere = true;
    }
    if (q.role) {
      const cond = 'u.role = :role';
      hasWhere
        ? qb.andWhere(cond, { role: q.role })
        : qb.where(cond, { role: q.role });
      hasWhere = true;
    }
    if (q.isActive !== undefined && q.isActive !== '') {
      const v = q.isActive === 'true' || q.isActive === true;
      const cond = 'u.isActive = :isActive';
      hasWhere
        ? qb.andWhere(cond, { isActive: v })
        : qb.where(cond, { isActive: v });
      hasWhere = true;
    }
    qb.orderBy('u.createdAt', q.order === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items.map(sanitize), meta: meta(total, page, limit) };
  }

  async getUser(id: string) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return sanitize(u);
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    if (dto.username && dto.username !== u.username) {
      const dup = await this.users.findOne({
        where: { username: dto.username },
      });
      if (dup) throw new ConflictException('username already taken');
    }
    if (dto.email && dto.email !== u.email) {
      const dup = await this.users.findOne({
        where: { email: dto.email },
      });
      if (dup) throw new ConflictException('email already taken');
    }
    await this.users.update(id, dto);
    return this.getUser(id);
  }

  async removeUser(id: string) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    await this.users.delete(id);
    return { deleted: true };
  }

  async listCustomers(q: any) {
    const { page, limit } = pageLimit(q);
    const search = (q.search || '').trim();
    const qb = this.users.createQueryBuilder('u');
    qb.where('LOWER(u.role) IN (:...roles)', { roles: ['customer', 'user'] });
    if (search)
      qb.andWhere(
        '(u.username LIKE :s OR u.name LIKE :s OR u.family LIKE :s OR u.email LIKE :s)',
        { s: `%${search}%` },
      );
    if (q.isActive !== undefined && q.isActive !== '')
      qb.andWhere('u.isActive = :isActive', {
        isActive: q.isActive === 'true',
      });
    qb.orderBy('u.createdAt', q.order === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items.map(sanitize), meta: meta(total, page, limit) };
  }

  async getCustomer(id: string) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Customer not found');
    if (!['customer', 'user'].includes(String(u.role).toLowerCase()))
      throw new NotFoundException('Not a customer');
    return sanitize(u);
  }

  async listBarbers(q: any) {
    const { page, limit } = pageLimit(q);
    const search = (q.search || '').trim();
    const qb = this.barbers.createQueryBuilder('b');
    qb.leftJoinAndSelect('b.user', 'user')
      .leftJoinAndSelect('b.barbershop', 'shop')
      .leftJoinAndSelect('b.barberServices', 'bs')
      .leftJoinAndSelect('bs.service', 'svc');
    let hasWhere = false;
    if (search) {
      qb.where('(b.fullName LIKE :s OR b.bio LIKE :s)', { s: `%${search}%` });
      hasWhere = true;
    }
    if (q.status) {
      hasWhere
        ? qb.andWhere('b.status = :status', { status: q.status })
        : qb.where('b.status = :status', { status: q.status });
      hasWhere = true;
    }
    if (q.isActive !== undefined && q.isActive !== '') {
      const v = q.isActive === 'true' || q.isActive === true;
      hasWhere
        ? qb.andWhere('b.isActive = :isActive', { isActive: v })
        : qb.where('b.isActive = :isActive', { isActive: v });
      hasWhere = true;
    }
    if (q.barbershopId) {
      hasWhere
        ? qb.andWhere('b.barbershopId = :bid', { bid: q.barbershopId })
        : qb.where('b.barbershopId = :bid', { bid: q.barbershopId });
    }
    qb.orderBy('b.createdAt', q.order === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items, meta: meta(total, page, limit) };
  }

  async getBarber(id: string) {
    const b = await this.barbers.findOne({
      where: { id },
      relations: {
        barberServices: { service: true },
        user: true,
        barbershop: true,
      },
    });
    if (!b) throw new NotFoundException('Barber not found');
    return b;
  }

  async updateBarber(id: string, dto: any) {
    await this.getBarber(id);
    if (
      dto.status &&
      dto.status !== BarberStatus.ACTIVE &&
      dto.status !== BarberStatus.INACTIVE
    )
      throw new BadRequestException('status must be active|inactive');
    const { services, ...rest } = dto;
    if (Object.keys(rest).length) await this.barbers.update(id, rest);
    return this.getBarber(id);
  }

  async removeBarber(id: string) {
    await this.getBarber(id);
    await this.barbers.delete(id);
    return { deleted: true };
  }

  async listServices(q: any) {
    const { page, limit } = pageLimit(q);
    const search = (q.search || '').trim();
    const qb = this.services.createQueryBuilder('s');
    let hasWhere = false;
    if (search) {
      qb.where('(s.name LIKE :s OR s.description LIKE :s)', {
        s: `%${search}%`,
      });
      hasWhere = true;
    }
    if (q.barberId) {
      hasWhere
        ? qb.andWhere('s.barberId = :barberId', { barberId: q.barberId })
        : qb.where('s.barberId = :barberId', { barberId: q.barberId });
      hasWhere = true;
    }
    if (q.barbershopId) {
      hasWhere
        ? qb.andWhere('s.barbershopId = :shopId', { shopId: q.barbershopId })
        : qb.where('s.barbershopId = :shopId', { shopId: q.barbershopId });
    }
    qb.orderBy('s.createdAt', q.order === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items, meta: meta(total, page, limit) };
  }

  async getService(id: string) {
    const s = await this.services.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    return s;
  }

  async createService(dto: any) {
    if (dto.barberId) {
      const b = await this.barbers.findOne({ where: { id: dto.barberId } });
      if (!b) throw new NotFoundException('Barber not found');
    }
    return this.services.save(this.services.create(dto) as any);
  }

  async updateService(id: string, dto: any) {
    await this.getService(id);
    if (dto.barberId) {
      const b = await this.barbers.findOne({ where: { id: dto.barberId } });
      if (!b) throw new NotFoundException('Barber not found');
    }
    await this.services.update(id, dto);
    return this.getService(id);
  }

  async removeService(id: string) {
    await this.getService(id);
    await this.services.delete(id);
    return { deleted: true };
  }

  async listAppointments(q: any) {
    const { page, limit } = pageLimit(q);
    const qb = this.appointments.createQueryBuilder('a');
    qb.leftJoinAndSelect('a.user', 'user')
      .leftJoinAndSelect('a.barber', 'barber')
      .leftJoinAndSelect('a.service', 'service');
    if (q.status) qb.andWhere('a.status = :status', { status: q.status });
    if (q.barberId)
      qb.andWhere('a.barberId = :barberId', { barberId: q.barberId });
    if (q.from) qb.andWhere('a.startTime >= :from', { from: new Date(q.from) });
    if (q.to) qb.andWhere('a.startTime <= :to', { to: new Date(q.to) });
    if ((q.search || '').trim())
      qb.andWhere('(a.notes LIKE :s)', { s: `%${(q.search || '').trim()}%` });
    qb.orderBy('a.startTime', q.order === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items, meta: meta(total, page, limit) };
  }

  async getAppointment(id: string) {
    const a = await this.appointments.findOne({
      where: { id },
      relations: { user: true, barber: true, service: true },
    });
    if (!a) throw new NotFoundException('Appointment not found');
    return a;
  }

  async updateAppointmentStatus(id: string, status: string) {
    const a = await this.appointments.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Appointment not found');
    const allowed = ALLOWED[a.status];
    if (!allowed || !allowed.includes(status))
      throw new BadRequestException(
        `Cannot transition from ${a.status} to ${status}`,
      );
    (a as any).status = status;
    await this.appointments.save(a as any);
    return this.getAppointment(id);
  }

  async cancelAppointment(id: string) {
    const a = await this.appointments.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Appointment not found');
    if (
      [
        AppointmentStatus.CANCELLED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.NO_SHOW,
      ].includes(a.status as any)
    )
      throw new BadRequestException(`Cannot cancel with status ${a.status}`);
    (a as any).status = AppointmentStatus.CANCELLED;
    await this.appointments.save(a as any);
    return this.getAppointment(id);
  }

  async removeAppointment(id: string) {
    await this.getAppointment(id);
    await this.appointments.delete(id);
    return { deleted: true };
  }

  async reports(q: any) {
    const qb = this.appointments.createQueryBuilder('a');
    qb.leftJoinAndSelect('a.service', 'service').leftJoinAndSelect(
      'a.barber',
      'barber',
    );
    if (q.from) qb.andWhere('a.startTime >= :from', { from: new Date(q.from) });
    if (q.to) qb.andWhere('a.startTime <= :to', { to: new Date(q.to) });
    const items = await qb.getMany();
    const byStatus: Record<string, number> = {};
    for (const a of items) byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    const revenue = items
      .filter((a) => a.status === AppointmentStatus.COMPLETED)
      .reduce((s, a: any) => s + Number(a.service?.price || 0), 0);
    const byDay: Record<string, number> = {};
    for (const a of items)
      byDay[new Date(a.startTime).toISOString().slice(0, 10)] =
        (byDay[new Date(a.startTime).toISOString().slice(0, 10)] || 0) + 1;
    const byBarber: Record<string, number> = {};
    for (const a of items)
      byBarber[a.barberId] = (byBarber[a.barberId] || 0) + 1;
    const topBarbers = Object.entries(byBarber)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([barberId, count]) => ({ barberId, count }));
    return {
      total: items.length,
      byStatus,
      revenue: Math.round(revenue * 100) / 100,
      byDay,
      topBarbers,
    };
  }

  async listSettings() {
    return this.settings.find({ order: { key: 'ASC' } as any });
  }
  async getSetting(key: string) {
    const s = await this.settings.findOne({ where: { key } });
    if (!s) throw new NotFoundException('Setting not found');
    return s;
  }
  async createSetting(dto: CreateSettingDto) {
    const ex = await this.settings.findOne({ where: { key: dto.key } });
    if (ex) throw new ConflictException('key already exists');
    return this.settings.save(this.settings.create(dto as any) as any);
  }
  async updateSetting(key: string, dto: AdminUpdateSettingDto) {
    const s = await this.getSetting(key);
    await this.settings.update(s.id, dto);
    return this.getSetting(key);
  }
  async removeSetting(key: string) {
    const s = await this.getSetting(key);
    await this.settings.delete(s.id);
    return { deleted: true };
  }
}
