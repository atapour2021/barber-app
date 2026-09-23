import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

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
