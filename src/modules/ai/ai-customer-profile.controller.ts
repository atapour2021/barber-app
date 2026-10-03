import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiCustomerProfileController {
  constructor(private readonly ai: AiService) {}

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('customer-profile/:customerId')
  @ApiOperation({ summary: 'AI customer profile: history + recommendations for barber' })
  @ApiParam({ name: 'customerId', type: 'string' })
  getProfile(@Param('customerId', ParseUUIDPipe) customerId: string, @CurrentUser() user: any) {
    return this.ai.customerProfile(customerId, user);
  }
}
