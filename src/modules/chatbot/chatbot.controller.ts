import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { ChatbotService, ChatRole } from './chatbot.service';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly svc: ChatbotService) {}

  @Public()
  @Post('ask')
  @ApiOperation({ summary: 'Ask help chatbot (customer/barber)' })
  ask(@Body() dto: AskChatbotDto) {
    const role: ChatRole = dto.role ?? 'customer';
    const res = this.svc.ask(dto.message, role);
    return res;
  }

  @Public()
  @Get('faqs')
  @ApiOperation({ summary: 'FAQ suggestions by role' })
  @ApiQuery({ name: 'role', required: false, enum: ['customer', 'barber', 'admin'] })
  faqs(@Query('role') role?: string) {
    const r = (role === 'barber' || role === 'admin' ? role : 'customer') as ChatRole;
    return { role: r, items: this.svc.faqs(r) };
  }
}
