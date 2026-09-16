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

  findAll(barberId?: string, barbershopId?: string) {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    if (barbershopId) where.barbershopId = barbershopId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } as any });
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
