import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { User } from '../users/entities/user.entity';
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
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  private async assertBarberOwnership(barberId: string, actor: any) {
    if (isAdmin(actor?.role)) return;
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    if (barber.userId !== actor?.id)
      throw new ForbiddenException('not allowed for this barber');
  }

  private assertUserOwnership(userId: string, actor: any) {
    if (isAdmin(actor?.role)) return;
    if (actor?.id !== userId)
      throw new ForbiddenException('not allowed for this user');
  }

  private async assertLocationOwnership(loc: Location, actor: any) {
    if (isAdmin(actor?.role)) return;
    if (loc.barberId) return this.assertBarberOwnership(loc.barberId, actor);
    if (loc.userId && actor?.id !== loc.userId)
      throw new ForbiddenException('not allowed for this location');
  }

  async create(dto: CreateLocationDto, actor: any) {
    if (!dto.barberId && !dto.userId) {
      const uid = actor?.id ?? actor?.sub;
      if (!uid) throw new BadRequestException('barberId or userId required');
      (dto as any).userId = uid;
    }
    const hasBarber = !!dto.barberId;
    const hasUser = !!dto.userId;
    if (hasBarber && hasUser)
      throw new BadRequestException('provide only one of barberId or userId');

    if (dto.barberId) {
      const barber = await this.barberRepo.findOne({
        where: { id: dto.barberId },
      });
      if (!barber) throw new NotFoundException('Barber not found');
      await this.assertBarberOwnership(dto.barberId, actor);
      const existing = await this.repo.findOne({
        where: { barberId: dto.barberId },
      });
      if (existing)
        throw new ConflictException('Location already exists for this barber');
      return this.repo.save(
        this.repo.create({
          address: dto.address,
          label: dto.label,
          latitude: dto.latitude,
          longitude: dto.longitude,
          mapMetadata: dto.mapMetadata,
          barberId: dto.barberId,
          userId: null,
        } as any),
      );
    }

    const userId = dto.userId as string;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    this.assertUserOwnership(userId, actor);
    return this.repo.save(
      this.repo.create({
        address: dto.address,
        label: dto.label,
        latitude: dto.latitude,
        longitude: dto.longitude,
        mapMetadata: dto.mapMetadata,
        barberId: null,
        userId,
      } as any),
    );
  }

  findAll(barberId?: string, userId?: string) {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    if (userId) where.userId = userId;
    return this.repo.find({
      where,
      relations: { barber: true, user: true },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async findMine(actor: any) {
    if (isAdmin(actor?.role)) return this.findAll();
    const barbers = await this.barberRepo.find({ where: { userId: actor.id } });
    const barberIds = barbers.map((b) => b.id);
    const where: any[] = [{ userId: actor.id }];
    for (const bid of barberIds) where.push({ barberId: bid });
    return this.repo.find({
      where,
      relations: { barber: true, user: true },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({
      where: { id },
      relations: { barber: true, user: true },
    });
    if (!e) throw new NotFoundException('Location not found');
    return e;
  }

  async findByBarberId(barberId: string) {
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    const e = await this.repo.findOne({
      where: { barberId },
      relations: { barber: true, user: true },
    });
    if (!e) throw new NotFoundException('Location not found for this barber');
    return e;
  }

  async findByUserId(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.repo.find({
      where: { userId },
      relations: { user: true },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async update(id: string, dto: UpdateLocationDto, actor: any) {
    const existing = await this.findOne(id);
    await this.assertLocationOwnership(existing, actor);
    if (!Object.keys(dto).length) return existing;
    const { barberId, userId, ...rest } = dto as any;
    await this.repo.update(id, rest as any);
    return this.findOne(id);
  }

  async remove(id: string, actor: any) {
    const existing = await this.findOne(id);
    await this.assertLocationOwnership(existing, actor);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
