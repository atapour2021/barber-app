import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barbershop } from './entities/barbershop.entity';
import { BarbershopsController } from './barbershops.controller';
import { BarbershopsService } from './barbershops.service';

@Module({
  imports: [TypeOrmModule.forFeature([Barbershop])],
  controllers: [BarbershopsController],
  providers: [BarbershopsService],
})
export class BarbershopsModule {}
