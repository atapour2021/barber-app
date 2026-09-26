import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barbershop } from './entities/barbershop.entity';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';

@Injectable()
export class BarbershopsService {
  constructor(
    @InjectRepository(Barbershop) private repo: Repository<Barbershop>,
  ) {}
  create(dto: CreateBarbershopDto) {
    return this.repo.save(this.repo.create(dto as any));
  }
  async findAll(q: any = {}) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const hasPaging = q.page !== undefined || q.limit !== undefined;
    if (!hasPaging) return this.repo.find({ order: { createdAt: 'DESC' } as any });
    const [data, total] = await this.repo.findAndCount({ order: { createdAt: 'DESC' } as any, skip: (page - 1) * limit, take: limit });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Barbershop not found');
    return e;
  }
  async update(id: string, dto: UpdateBarbershopDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
