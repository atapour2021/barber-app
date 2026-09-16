import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Barber])],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
