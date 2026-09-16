import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Educational } from './entities/educational.entity';
import { EducationalController } from './educational.controller';
import { EducationalService } from './educational.service';

@Module({
  imports: [TypeOrmModule.forFeature([Educational])],
  controllers: [EducationalController],
  providers: [EducationalService],
})
export class EducationalModule {}
