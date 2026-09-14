import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(@InjectRepository(Certificate) private repo: Repository<Certificate>) {}
  create(dto: CreateCertificateDto) { return this.repo.save(this.repo.create({ ...dto, issueDate: new Date(dto.issueDate), expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined } as any)); }
  findAll(barberId?: string) { return this.repo.find({ where: barberId ? { barberId } as any : {} }); }
  async findOne(id: string) { const e = await this.repo.findOne({ where: { id } as any }); if (!e) throw new NotFoundException('Certificate not found'); return e; }
  async update(id: string, dto: UpdateCertificateDto) { await this.findOne(id); await this.repo.update(id, dto as any); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.delete(id); return { deleted: true }; }
}
