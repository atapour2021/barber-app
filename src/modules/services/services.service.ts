import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private repo: Repository<Service>) {}
  create(dto: CreateServiceDto) { return this.repo.save(this.repo.create(dto as any)); }
  findAll(barbershopId?: string) { return this.repo.find({ where: barbershopId ? { barbershopId } as any : {} }); }
  async findOne(id: string) { const e = await this.repo.findOne({ where: { id } as any }); if (!e) throw new NotFoundException('Service not found'); return e; }
  async update(id: string, dto: UpdateServiceDto) { await this.findOne(id); await this.repo.update(id, dto as any); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.delete(id); return { deleted: true }; }
}
