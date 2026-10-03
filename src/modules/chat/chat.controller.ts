import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
  @Roles(Role.USER, Role.CUSTOMER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('faqs')
  @ApiOperation({ summary: 'Chatbot FAQs by role' })
  faqs(@Query('role') role: string, @CurrentUser() user: any) {
    const r = (role || user?.role || 'customer') as ChatRole;
    const isBarber = r === 'barber';
    const isAdmin = r === 'admin' || r === 'super_admin';
    const items = isBarber
      ? ['نوبت‌های امروز', 'مدیریت برنامه کاری', 'افزودن خدمت', 'برنامه کاری', 'وضعیت نوبت‌ها']
      : isAdmin
        ? ['داشبورد', 'مدیریت کاربران', 'مدیریت نوبت‌ها', 'تنظیمات']
        : ['رزرو نوبت', 'خدمات و قیمت', 'معرفی آرایشگران', 'پیگیری نوبت', 'کیف پول', 'مشاور هوشمند'];
    return { role: r, items };
  }
}
