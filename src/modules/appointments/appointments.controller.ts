import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Public()
  @Get('available-slots')
  @ApiOperation({ summary: 'Get available slots for barber on date' })
  @ApiQuery({ name: 'barberId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-09-20' })
  @ApiQuery({ name: 'serviceId', required: false })
  availableSlots(
    @Query('barberId') barberId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.service.availableSlots(barberId, date, serviceId);
  }

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create appointment (Customer)' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({
    summary: 'List appointments (Customer: own, Barber: assigned, Admin: all)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
  })
  @ApiQuery({ name: 'barberId', required: false })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-20' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('barberId') barberId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAll(user, { status, barberId, date });
  }

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by id (owner/Barber/Admin)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment notes (owner)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel appointment (Customer owner / Barber assigned / Admin)',
  })
  @ApiParam({ name: 'id' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.cancel(id, user);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update appointment status (Barber: accept/reject/complete, Admin: all)',
  })
  @ApiParam({ name: 'id' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateStatus(id, dto.status, user);
  }

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment (Owner or Admin)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
