import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  findAll(@CurrentUser() user: any, @Query() q: QueryNotificationDto) {
    return this.service.findAll(user.id, q);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread count' })
  unreadCount(@CurrentUser() user: any) {
    return this.service.unreadCount(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all as read' })
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one as read' })
  markRead(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.markRead(user.id, id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('reminders/run')
  @ApiOperation({ summary: 'Trigger appointment reminders (admin)' })
  runReminders() {
    return this.service.sendDueReminders();
  }
}
