import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}
  @Post() @ApiOperation({ summary: 'Create appointment' }) create(@Body() dto: CreateAppointmentDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'List appointments' }) findAll() { return this.service.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Get appointment' }) @ApiParam({ name: 'id' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update appointment' }) @ApiParam({ name: 'id' }) update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Delete appointment' }) @ApiParam({ name: 'id' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
