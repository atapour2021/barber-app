import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { HeuristicProvider } from './providers/heuristic.provider';
import { GapGptProvider } from './providers/gapgpt.provider';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiPreviewController } from './ai-preview.controller';

function providerFactory() {
  if (process.env.AI_API_URL && process.env.AI_API_KEY) {
    return new GapGptProvider();
  }
  return new HeuristicProvider();
}

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [AiController, AiPreviewController],
  providers: [{ provide: AI_PROVIDER, useFactory: providerFactory }, AiService],
  exports: [AiService],
})
export class AiModule {}
