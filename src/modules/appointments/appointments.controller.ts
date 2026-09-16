import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}
  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create appointment (authenticated users)' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'List appointments (Barber/Admin)' })
  findAll() {
    return this.service.findAll();
  }
  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment (owner/Barber/Admin)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment (owner/Barber/Admin)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
