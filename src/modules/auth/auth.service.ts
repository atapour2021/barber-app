import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
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
    const { password, ...rest } = user as any;
    return rest;
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
    return { user: this.sanitize(saved), access_token: this.sign(saved) };
  }
  async login(dto: LoginDto) {
    const user = await this.repo.findOne({
      where: { username: dto.username },
    });
    if (!user) throw new UnauthorizedException('invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('account disabled');
    return { user: this.sanitize(user), access_token: this.sign(user) };
  }
}
