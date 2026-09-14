import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barber } from './entities/barber.entity';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';

@Injectable()
export class BarbersService {
  constructor(@InjectRepository(Barber) private repo: Repository<Barber>) {}
  create(dto: CreateBarberDto) { return this.repo.save(this.repo.create(dto as any)); }
  findAll(barbershopId?: string) { return this.repo.find({ where: barbershopId ? { barbershopId } as any : {} }); }
  async findOne(id: string) { const e = await this.repo.findOne({ where: { id } as any }); if (!e) throw new NotFoundException('Barber not found'); return e; }
  async update(id: string, dto: UpdateBarberDto) { await this.findOne(id); await this.repo.update(id, dto as any); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.delete(id); return { deleted: true }; }
}
