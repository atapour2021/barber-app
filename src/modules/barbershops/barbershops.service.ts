import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barbershop } from './entities/barbershop.entity';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';

@Injectable()
export class BarbershopsService {
  constructor(@InjectRepository(Barbershop) private repo: Repository<Barbershop>) {}
  create(dto: CreateBarbershopDto) { return this.repo.save(this.repo.create(dto as any)); }
  findAll() { return this.repo.find(); }
  async findOne(id: string) { const e = await this.repo.findOne({ where: { id } as any }); if (!e) throw new NotFoundException('Barbershop not found'); return e; }
  async update(id: string, dto: UpdateBarbershopDto) { await this.findOne(id); await this.repo.update(id, dto as any); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.delete(id); return { deleted: true }; }
}
