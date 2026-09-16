import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Educational } from './entities/educational.entity';
import { CreateEducationalDto } from './dto/create-educational.dto';
import { UpdateEducationalDto } from './dto/update-educational.dto';

@Injectable()
export class EducationalService {
  constructor(
    @InjectRepository(Educational) private repo: Repository<Educational>,
  ) {}
  create(dto: CreateEducationalDto) {
    return this.repo.save(this.repo.create(dto as any));
  }
  findAll() {
    return this.repo.find();
  }
  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Educational not found');
    return e;
  }
  async update(id: string, dto: UpdateEducationalDto) {
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
