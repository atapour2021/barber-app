import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

function isAdmin(role?: string) {
  const r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private repo: Repository<Certificate>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
  ) {}

  private async assertBarberOwnership(barberId: string, actor: any) {
    if (isAdmin(actor?.role)) return;
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    if (barber.userId !== actor?.id)
      throw new ForbiddenException('not allowed for this barber');
  }

  private validateDates(issueDate: string, expiryDate?: string) {
    if (expiryDate && new Date(expiryDate) <= new Date(issueDate))
      throw new BadRequestException('expiryDate must be after issueDate');
  }

  async create(dto: CreateCertificateDto, actor: any) {
    const barber = await this.barberRepo.findOne({
      where: { id: dto.barberId },
    });
    if (!barber) throw new NotFoundException('Barber not found');
    await this.assertBarberOwnership(dto.barberId, actor);
    this.validateDates(dto.issueDate, dto.expiryDate);
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        issuer: dto.issuer,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
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
    const e = await this.repo.findOne({
      where: { id },
      relations: { barber: true },
    });
    if (!e) throw new NotFoundException('Certificate not found');
    return e;
  }

  async update(id: string, dto: UpdateCertificateDto, actor: any) {
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    const targetBarberId = (dto as any).barberId;
    if (targetBarberId && targetBarberId !== existing.barberId) {
      const nb = await this.barberRepo.findOne({
        where: { id: targetBarberId },
      });
      if (!nb) throw new NotFoundException('Barber not found');
      await this.assertBarberOwnership(targetBarberId, actor);
    }
    const issueDate =
      (dto as any).issueDate || existing.issueDate.toISOString().slice(0, 10);
    const expiryDate =
      (dto as any).expiryDate !== undefined
        ? (dto as any).expiryDate
        : existing.expiryDate?.toISOString().slice(0, 10);
    if ((dto as any).issueDate || (dto as any).expiryDate)
      this.validateDates(issueDate, expiryDate);
    const patch: any = { ...dto };
    if ((dto as any).issueDate)
      patch.issueDate = new Date((dto as any).issueDate);
    if ((dto as any).expiryDate !== undefined)
      patch.expiryDate = (dto as any).expiryDate
        ? new Date((dto as any).expiryDate)
        : null;
    if (Object.keys(patch).length) await this.repo.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: string, actor: any) {
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
