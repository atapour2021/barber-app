import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barber } from './entities/barber.entity';
import { BarberService as BarberServiceEntity } from './entities/barber-service.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { Barbershop } from '../barbershops/entities/barbershop.entity';
import { BarbersController } from './barbers.controller';
import { BarbersService } from './barbers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Barber,
      BarberServiceEntity,
      Service,
      User,
      Barbershop,
    ]),
  ],
  controllers: [BarbersController],
  providers: [BarbersService],
})
export class BarbersModule {}
