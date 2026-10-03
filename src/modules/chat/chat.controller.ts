import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatService, ChatRole } from './chat.service';
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}
  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('message')
  @ApiOperation({ summary: 'Chatbot message (rule-based, Persian)' })
  async message(@Body() dto: ChatMessageDto, @CurrentUser() user: any) {
    const role = (user?.role ?? 'customer') as ChatRole;
    const res = await this.chat.reply(dto.message, role, dto.history as any);
    return { ...res, role };
  }
}
