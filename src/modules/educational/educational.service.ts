import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Educational } from './entities/educational.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CreateEducationalDto } from './dto/create-educational.dto';
import { UpdateEducationalDto } from './dto/update-educational.dto';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
]);
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function isAdmin(role?: string) {
  const r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'super_admin';
}

@Injectable()
export class EducationalService {
  constructor(
    @InjectRepository(Educational) private repo: Repository<Educational>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
  ) {}

  private async assertBarberOwnership(barberId: string, actor: any) {
    if (isAdmin(actor?.role)) return;
    const barber = await this.barberRepo.findOne({ where: { id: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    if (barber.userId !== actor?.id)
      throw new ForbiddenException('not allowed for this barber');
  }

  private validateFile(file?: Express.Multer.File) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE)
      throw new BadRequestException('video too large (max 100MB)');
    if (!ALLOWED_VIDEO_MIMES.has(file.mimetype) && !file.mimetype.startsWith('video/'))
      throw new BadRequestException(`unsupported video type ${file.mimetype}`);
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.exe', '.sh', '.js', '.html'].includes(ext))
      throw new BadRequestException('invalid file extension');
  }

  private buildVideoFields(file?: Express.Multer.File) {
    if (!file) return {};
    return {
      videoUrl: `/uploads/educational/${file.filename}`,
      videoFilename: file.filename,
      originalFilename: path.basename(file.originalname),
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }

  private removeFile(filename?: string | null) {
    if (!filename) return;
    const p = path.join(process.cwd(), 'uploads', 'educational', filename);
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {}
    }
  }

  async create(
    dto: CreateEducationalDto,
    actor: any,
    file?: Express.Multer.File,
  ) {
    const barber = await this.barberRepo.findOne({ where: { id: dto.barberId } });
    if (!barber) throw new NotFoundException('Barber not found');
    await this.assertBarberOwnership(dto.barberId, actor);
    this.validateFile(file);
    const video = this.buildVideoFields(file);
    const entity = this.repo.create({
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      barberId: dto.barberId,
      ...video,
    } as any);
    return this.repo.save(entity);
  }

  findAll(barberId?: string) {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    return this.repo.find({
      where,
      relations: { barber: true },
      order: { createdAt: 'DESC' } as any,
    });
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({
      where: { id },
      relations: { barber: true },
    });
    if (!e) throw new NotFoundException('Educational not found');
    return e;
  }

  async update(
    id: string,
    dto: UpdateEducationalDto,
    actor: any,
    file?: Express.Multer.File,
  ) {
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    if ((dto as any).barberId && (dto as any).barberId !== existing.barberId) {
      const nb = await this.barberRepo.findOne({
        where: { id: (dto as any).barberId },
      });
      if (!nb) throw new NotFoundException('Barber not found');
      await this.assertBarberOwnership((dto as any).barberId, actor);
    }
    this.validateFile(file);
    const oldFilename = existing.videoFilename;
    const video = this.buildVideoFields(file);
    if (file && oldFilename) this.removeFile(oldFilename);
    await this.repo.update(id, { ...dto, ...video } as any);
    return this.findOne(id);
  }

  async remove(id: string, actor: any) {
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    this.removeFile(existing.videoFilename);
    await this.repo.delete(id);
    return { deleted: true };
  }

  async uploadVideo(id: string, actor: any, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('video file required');
    this.validateFile(file);
    const existing = await this.findOne(id);
    await this.assertBarberOwnership(existing.barberId, actor);
    this.removeFile(existing.videoFilename);
    const video = this.buildVideoFields(file);
    await this.repo.update(id, video as any);
    return this.findOne(id);
  }
}
