import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { HeuristicProvider } from './providers/heuristic.provider';
import { GapGptProvider } from './providers/gapgpt.provider';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiPreviewController } from './ai-preview.controller';
import { AiServiceRecommendController } from './ai-service-recommend.controller';
import { AiCustomerProfileController } from './ai-customer-profile.controller';
import { AiSmartReminderController } from './ai-smart-reminder.controller';
import { NotificationsModule } from '../notifications/notifications.module';

function providerFactory() {
  if (process.env.AI_API_URL && process.env.AI_API_KEY) {
    return new GapGptProvider();
  }
  return new HeuristicProvider();
}

@Module({
  imports: [TypeOrmModule.forFeature([Service, User, Appointment, Barber]), NotificationsModule],
  controllers: [
    AiController,
    AiPreviewController,
    AiServiceRecommendController,
    AiCustomerProfileController,
    AiSmartReminderController,
  ],
  providers: [{ provide: AI_PROVIDER, useFactory: providerFactory }, AiService],
  exports: [AiService],
})
export class AiModule {}
