import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

function isAdmin(role?: string) {
  const r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private repo: Repository<Location>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
  ) {}

  private async assertBarberOwnership(barberId: string, actor: any) {
    if (isAdmin(actor?.role)) return;
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    if (barber.userId !== actor?.id)
      throw new ForbiddenException('not allowed for this barber');
  }

  async create(dto: CreateLocationDto, actor: any) {
    const barber = await this.barberRepo.findOne({ where: { id: dto.barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    await this.assertBarberOwnership(dto.barberId, actor);
    const existing = await this.repo.findOne({ where: { barberId: dto.barberId } });
    if (existing) throw new ConflictException('Location already exists for this barber');
    return this.repo.save(
      this.repo.create({
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        mapMetadata: dto.mapMetadata,
        barberId: dto.barberId,
      } as any),
    );
  }

  findAll(barberId?: string) {
    return this.repo.find({
      where: barberId ? { barberId } : {},
      relations: { barber: true },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id }, relations: { barber: true } });
    if (!e) throw new NotFoundException('Location not found');
    return e;
  }

  async findByBarberId(barberId: string) {
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    const e = await this.repo.findOne({ where: { barberId }, relations: { barber: true } });
    if (!e) throw new NotFoundException('Location not found for this barber');
    return e;
  }

  async update(id: string, dto: UpdateLocationDto, actor: any) {
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    if (!Object.keys(dto).length) return existing;
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string, actor: any) {
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
