import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private resetRepo: Repository<PasswordResetToken>,
    private jwt: JwtService,
  ) {}

  private sign(user: User) {
    return this.jwt.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
  }

  private sanitize(user: User) {
    const { password, ...rest } = user;
    return rest;
  }

  private hashToken(t: string) {
    return createHash('sha256').update(t).digest('hex');
  }

  private genOpaque() {
    return randomBytes(48).toString('hex');
  }

  private async issueRefresh(user: User) {
    const raw = this.genOpaque();
    const hash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      } as any),
    );
    return raw;
  }

  async register(dto: RegisterDto) {
    const dup = await this.repo.findOne({
      where: [{ username: dto.username }, { nationalCode: dto.nationalCode }],
    });
    if (dup) {
      if (dup.username === dto.username)
        throw new ConflictException('username already taken');
      throw new ConflictException('nationalCode already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({ ...dto, password: hashed } as any);
    const raw = await this.repo.save(user as any);
    const saved = (Array.isArray(raw) ? raw[0] : raw) as User;
    const access_token = this.sign(saved);
    const refresh_token = await this.issueRefresh(saved);
    return { user: this.sanitize(saved), access_token, refresh_token };
  }

  async login(dto: LoginDto) {
    const user = await this.repo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('account disabled');
    const access_token = this.sign(user);
    const refresh_token = await this.issueRefresh(user);
    return { user: this.sanitize(user), access_token, refresh_token };
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash: hash },
    });
    if (!stored) throw new UnauthorizedException('invalid refresh token');
    if (stored.revokedAt)
      throw new UnauthorizedException('refresh token revoked');
    if (stored.expiresAt < new Date())
      throw new UnauthorizedException('refresh token expired');
    const user = await this.repo.findOne({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('invalid token');
    if (!user.isActive) throw new UnauthorizedException('account disabled');
    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);
    const newRaw = this.genOpaque();
    const newHash = this.hashToken(newRaw);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const created = this.refreshRepo.create({
      userId: user.id,
      tokenHash: newHash,
      expiresAt,
    } as any);
    const saved = await this.refreshRepo.save(created as any);
    stored.replacedById = saved.id;
    await this.refreshRepo.save(stored);
    return { access_token: this.sign(user), refresh_token: newRaw };
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash: hash },
    });
    if (!stored) return { message: 'logged out' };
    if (!stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshRepo.save(stored);
    }
    return { message: 'logged out' };
  }

  async logoutAll(userId: string) {
    await this.refreshRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
    return { message: 'logged out from all devices' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    if (!dto.email && !dto.username)
      throw new BadRequestException('email or username required');
    let user: User | null = null;
    if (dto.email)
      user = await this.repo.findOne({ where: { email: dto.email } });
    if (!user && dto.username)
      user = await this.repo.findOne({ where: { username: dto.username } });
    if (!user) return { message: 'if account exists, reset email sent' };
    await this.resetRepo
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: new Date() })
      .where('userId = :userId AND usedAt IS NULL', { userId: user.id })
      .execute();
    const raw = this.genOpaque();
    const hash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.resetRepo.save(
      this.resetRepo.create({
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      } as any),
    );
    return { message: 'if account exists, reset email sent', reset_token: raw };
  }

  async resetPassword(token: string, newPassword: string) {
    const hash = this.hashToken(token);
    const stored = await this.resetRepo.findOne({ where: { tokenHash: hash } });
    if (!stored) throw new BadRequestException('invalid reset token');
    if (stored.usedAt)
      throw new BadRequestException('reset token already used');
    if (stored.expiresAt < new Date())
      throw new BadRequestException('reset token expired');
    const user = await this.repo.findOne({ where: { id: stored.userId } });
    if (!user) throw new BadRequestException('invalid reset token');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
    stored.usedAt = new Date();
    await this.resetRepo.save(stored);
    await this.logoutAll(user.id);
    return { message: 'password reset successfully' };
  }
}
