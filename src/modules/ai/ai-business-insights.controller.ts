import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { AiService } from './ai.service';
import { BusinessInsightsQueryDto } from './dto/business-insights.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiBusinessInsightsController {
  constructor(private readonly ai: AiService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('business-insights')
  @ApiOperation({ summary: 'AI Business Insights: aggregates + trends/anomalies/recommendations (admin)' })
  insights(@Query() q: BusinessInsightsQueryDto) {
    return this.ai.businessInsights(q as any);
  }
}
