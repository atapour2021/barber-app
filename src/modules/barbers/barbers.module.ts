import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barber } from './entities/barber.entity';
import { BarbersController } from './barbers.controller';
import { BarbersService } from './barbers.service';

@Module({ imports: [TypeOrmModule.forFeature([Barber])], controllers: [BarbersController], providers: [BarbersService] })
export class BarbersModule {}
