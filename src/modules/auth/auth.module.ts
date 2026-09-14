import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({ secret: process.env.JWT_SECRET || 'secret', signOptions: { expiresIn: '1d' } }), PassportModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
