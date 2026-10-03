import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Service, Barber])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
