import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service) private repo: Repository<Service>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
  ) {}

  private isAdmin(role?: string) {
    const r = String(role || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  private async resolveBarberId(actor: any, requested?: string) {
    if (this.isAdmin(actor?.role)) {
      if (requested) {
        const b = await this.barberRepo.findOne({ where: { id: requested } });
        if (!b) throw new NotFoundException('Barber not found');
        return b.id;
      }
      const mine = await this.barberRepo.findOne({
        where: { userId: actor.id },
      });
      if (mine) return mine.id;
      throw new BadRequestException('barberId required');
    }
    const mine = await this.barberRepo.findOne({ where: { userId: actor.id } });
    if (!mine) throw new NotFoundException('Barber profile not found');
    if (requested && requested !== mine.id)
      throw new ForbiddenException('cannot create service for another barber');
    return mine.id;
  }

  private async assertCanMutate(service: Service, actor: any) {
    if (this.isAdmin(actor?.role)) return;
    const mine = await this.barberRepo.findOne({ where: { userId: actor.id } });
    if (!mine) throw new ForbiddenException('barber profile required');
    if (service.barberId !== mine.id)
      throw new ForbiddenException('not allowed to modify this service');
  }

  async create(dto: CreateServiceDto, actor: any) {
    const barberId = await this.resolveBarberId(actor, dto.barberId);
    const { barberId: _b, ...rest } = dto as any;
    return this.repo.save(this.repo.create({ ...rest, barberId }));
  }

  async findAll(barberId?: string, barbershopId?: string, q?: any) {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    if (barbershopId) where.barbershopId = barbershopId;
    const hasPaging = q?.page !== undefined || q?.limit !== undefined;
    if (!hasPaging) return this.repo.find({ where, order: { createdAt: 'DESC' } as any });
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const [data, total] = await this.repo.findAndCount({ where, order: { createdAt: 'DESC' } as any, skip: (page - 1) * limit, take: limit });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Service not found');
    return e;
  }

  async update(id: string, dto: UpdateServiceDto, actor: any) {
    const e = await this.findOne(id);
    await this.assertCanMutate(e, actor);
    const { barberId: _b, ...rest } = dto as any;
    if (!Object.keys(rest).length) return e;
    await this.repo.update(id, rest);
    return this.findOne(id);
  }

  async remove(id: string, actor: any) {
    const e = await this.findOne(id);
    await this.assertCanMutate(e, actor);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
