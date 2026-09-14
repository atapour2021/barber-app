import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private repo: Repository<User>) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: process.env.JWT_SECRET || 'barber_secret' });
  }
  async validate(payload: any) {
    const user = await this.repo.findOne({ where: { id: payload.sub } as any });
    if (!user) throw new UnauthorizedException('invalid token');
    const { password, ...result } = user as any;
    return result;
  }
}
