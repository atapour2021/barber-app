import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

function sanitize(u: User) {
  const { password, ...r } = u as any;
  return r;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  findAll() {
    return this.repo.find();
  }
  async findOne(id: string) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }
  async getMe(userId: string) {
    const u = await this.findOne(userId);
    return sanitize(u);
  }
  async updateMe(userId: string, dto: UpdateProfileDto) {
    const u = await this.findOne(userId);
    if (dto.email && dto.email !== u.email) {
      const dup = await this.repo.findOne({ where: { email: dto.email } });
      if (dup) throw new ConflictException('email already taken');
    }
    const allowed: Record<string, unknown> = {};
    for (const k of ['name', 'family', 'phoneNumber', 'email', 'profileImage'] as const) {
      if ((dto as any)[k] !== undefined) allowed[k] = (dto as any)[k];
    }
    if (Object.keys(allowed).length) await this.repo.update(userId, allowed as any);
    return this.getMe(userId);
  }
  async getPreferences(userId: string) {
    const u = await this.findOne(userId);
    return { themePreference: (u as any).themePreference ?? 'light', smsReminder: (u as any).smsReminder ?? true };
  }
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    await this.findOne(userId);
    if (dto.themePreference !== undefined || dto.smsReminder !== undefined) {
      await this.repo.update(userId, dto as any);
    }
    return this.getPreferences(userId);
  }
}
