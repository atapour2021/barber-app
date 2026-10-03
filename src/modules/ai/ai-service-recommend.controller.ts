import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AiService } from './ai.service';
import { ServiceRecommendDto } from './dto/service-recommend.dto';
import { POOL as HAIR_POOL } from './providers/heuristic.provider';
import { BadRequestException } from '@nestjs/common';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiServiceRecommendController {
  constructor(
    private readonly ai: AiService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('service-recommendations')
  @ApiOperation({
    summary: 'AI service recommendations for selected hairstyle + profile',
  })
  async recommend(@CurrentUser() user: any, @Body() dto: ServiceRecommendDto) {
    let hairstyle: any = dto.hairstyle;
    if (!hairstyle && dto.hairstyleId) {
      hairstyle =
        (HAIR_POOL as any[]).find((x) => x.id === dto.hairstyleId) ?? null;
      if (!hairstyle) throw new BadRequestException('hairstyle not found');
      hairstyle = { ...hairstyle, confidence: 0.9, reason: '', reasonFa: '' };
    }
    if (!hairstyle?.id)
      throw new BadRequestException('hairstyleId or hairstyle required');
    const uid = user?.id ?? user?.sub;
    let profile: any = undefined;
    if (uid) {
      const u = await this.userRepo.findOne({ where: { id: uid } });
      if (u) profile = { name: u.name, family: u.family, username: u.username };
    }
    const normalized = {
      id: String(hairstyle.id),
      title: String(hairstyle.title ?? hairstyle.id),
      titleFa: String(hairstyle.titleFa ?? hairstyle.title ?? hairstyle.id),
      category: String(hairstyle.category ?? 'general'),
      length: ['short', 'medium', 'long'].includes(String(hairstyle.length))
        ? hairstyle.length
        : 'medium',
      description: String(hairstyle.description ?? ''),
      descriptionFa: String(hairstyle.descriptionFa ?? ''),
      reason: String(hairstyle.reason ?? ''),
      reasonFa: String(hairstyle.reasonFa ?? ''),
      stylingTips: Array.isArray(hairstyle.stylingTips)
        ? hairstyle.stylingTips.map(String)
        : [],
      stylingTipsFa: Array.isArray(hairstyle.stylingTipsFa)
        ? hairstyle.stylingTipsFa.map(String)
        : [],
      confidence:
        typeof hairstyle.confidence === 'number' ? hairstyle.confidence : 0.85,
      suitableFaceShapes: Array.isArray(hairstyle.suitableFaceShapes)
        ? hairstyle.suitableFaceShapes
        : [],
      maintenance: ['low', 'medium', 'high'].includes(
        String(hairstyle.maintenance),
      )
        ? hairstyle.maintenance
        : 'medium',
      tags: Array.isArray(hairstyle.tags) ? hairstyle.tags.map(String) : [],
    };
    return this.ai.recommendServices({
      hairstyle: normalized,
      profile,
      barberId: dto.barberId,
      barbershopId: dto.barbershopId,
    });
  }
}
