import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(@InjectRepository(Appointment) private repo: Repository<Appointment>) {}
  create(dto: CreateAppointmentDto) { return this.repo.save(this.repo.create({ ...dto, date: new Date(dto.date), startTime: new Date(dto.startTime), endTime: new Date(dto.endTime) } as any)); }
  findAll() { return this.repo.find({ relations: { user: true, barber: true, service: true } as any }); }
  async findOne(id: string) { const e = await this.repo.findOne({ where: { id } as any, relations: { user: true, barber: true, service: true } as any }); if (!e) throw new NotFoundException('Appointment not found'); return e; }
  async update(id: string, dto: UpdateAppointmentDto) { await this.findOne(id); await this.repo.update(id, dto as any); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.delete(id); return { deleted: true }; }
}
