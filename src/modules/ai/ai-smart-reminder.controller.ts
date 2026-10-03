import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { AiService } from './ai.service';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiSmartReminderController {
  constructor(private readonly ai: AiService, private readonly notifications: NotificationsService) {}

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('smart-reminder/me')
  @ApiOperation({ summary: 'AI smart reminder for current user: predict next appointment + personalized message' })
  getForMe(@CurrentUser() user: any) {
    return this.ai.smartReminderForSelf(user);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('smart-reminder/customer/:customerId')
  @ApiOperation({ summary: 'AI smart reminder for a customer (barber/admin)' })
  @ApiParam({ name: 'customerId', type: 'string' })
  getForCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.ai.smartReminderFor(customerId);
  }

  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('smart-reminder/me/send')
  @ApiOperation({ summary: 'Generate smart reminder message and dispatch as notification to self' })
  async sendForMe(@CurrentUser() user: any) {
    const r = await this.ai.smartReminderForSelf(user);
    const uid = String(user.id ?? user.sub);
    const n = await this.notifications.notifySmartReminder(uid, r.messageFa, {
      predictedDate: r.predictedDate,
      predictedDaysFromNow: r.predictedDaysFromNow,
      frequencyLabelFa: r.frequencyLabelFa,
      suggestedServices: r.suggestedServices,
      stats: r.stats,
    });
    return { reminder: r, notification: n };
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('smart-reminder/customer/:customerId/send')
  @ApiOperation({ summary: 'Generate smart reminder and dispatch notification to customer' })
  @ApiParam({ name: 'customerId', type: 'string' })
  async sendForCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const r = await this.ai.smartReminderFor(customerId);
    const n = await this.notifications.notifySmartReminder(customerId, r.messageFa, {
      predictedDate: r.predictedDate,
      predictedDaysFromNow: r.predictedDaysFromNow,
      frequencyLabelFa: r.frequencyLabelFa,
      suggestedServices: r.suggestedServices,
      stats: r.stats,
    });
    return { reminder: r, notification: n };
  }
}
