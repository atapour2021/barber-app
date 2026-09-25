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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { AdminService } from './admin.service';
import {
  AppointmentsQueryDto,
  BarbersQueryDto,
  ReportsQueryDto,
  ServicesQueryDto,
  UsersQueryDto,
} from './dto/pagination.dto';
import {
  AdminResetPasswordDto,
  AdminToggleActiveDto,
  AdminUpdateUserDto,
  AdminUpdateSettingDto,
  CreateSettingDto,
} from './dto/update-user.dto';
import { UpdateAppointmentStatusDto } from '../appointments/dto/update-appointment-status.dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users (Admin)' })
  listUsers(@Query() q: UsersQueryDto) {
    return this.admin.listUsers(q);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by id (Admin)' })
  @ApiParam({ name: 'id' })
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (Admin)' })
  @ApiParam({ name: 'id' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.admin.updateUser(id, dto);
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Activate/deactivate user (Admin)' })
  @ApiParam({ name: 'id' })
  toggleUserActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminToggleActiveDto,
    @CurrentUser() actor: any,
  ) {
    return this.admin.toggleUserActive(id, dto, actor);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password (Admin)' })
  @ApiParam({ name: 'id' })
  resetUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.admin.resetUserPassword(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin)' })
  @ApiParam({ name: 'id' })
  removeUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: any) {
    return this.admin.removeUser(id, actor);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customers (Admin)' })
  listCustomers(@Query() q: UsersQueryDto) {
    return this.admin.listCustomers(q);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer by id (Admin)' })
  @ApiParam({ name: 'id' })
  getCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getCustomer(id);
  }

  @Get('barbers')
  @ApiOperation({ summary: 'List barbers (Admin)' })
  listBarbers(@Query() q: BarbersQueryDto) {
    return this.admin.listBarbers(q);
  }

  @Get('barbers/:id')
  @ApiOperation({ summary: 'Get barber by id (Admin)' })
  @ApiParam({ name: 'id' })
  getBarber(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getBarber(id);
  }

  @Patch('barbers/:id')
  @ApiOperation({ summary: 'Update barber (Admin)' })
  @ApiParam({ name: 'id' })
  updateBarber(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.admin.updateBarber(id, dto);
  }

  @Patch('barbers/:id/toggle-active')
  @ApiOperation({ summary: 'Activate/deactivate barber (Admin)' })
  @ApiParam({ name: 'id' })
  toggleBarberActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminToggleActiveDto,
  ) {
    return this.admin.toggleBarberActive(id, dto);
  }

  @Post('barbers/:id/reset-password')
  @ApiOperation({ summary: 'Reset barber password (Admin, via linked user)' })
  @ApiParam({ name: 'id' })
  resetBarberPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.admin.resetBarberPassword(id, dto);
  }

  @Delete('barbers/:id')
  @ApiOperation({ summary: 'Delete barber (Admin)' })
  @ApiParam({ name: 'id' })
  removeBarber(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeBarber(id);
  }

  @Get('services')
  @ApiOperation({ summary: 'List services (Admin)' })
  listServices(@Query() q: ServicesQueryDto) {
    return this.admin.listServices(q);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get service by id (Admin)' })
  @ApiParam({ name: 'id' })
  getService(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getService(id);
  }

  @Post('services')
  @ApiOperation({ summary: 'Create service (Admin)' })
  createService(@Body() dto: any) {
    return this.admin.createService(dto);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update service (Admin)' })
  @ApiParam({ name: 'id' })
  updateService(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.admin.updateService(id, dto);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Delete service (Admin)' })
  @ApiParam({ name: 'id' })
  removeService(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeService(id);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'List appointments (Admin)' })
  listAppointments(@Query() q: AppointmentsQueryDto) {
    return this.admin.listAppointments(q);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment by id (Admin)' })
  @ApiParam({ name: 'id' })
  getAppointment(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getAppointment(id);
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment status (Admin)' })
  @ApiParam({ name: 'id' })
  updateAppointmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.admin.updateAppointmentStatus(id, dto.status);
  }

  @Post('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment (Admin)' })
  @ApiParam({ name: 'id' })
  cancelAppointment(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.cancelAppointment(id);
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Delete appointment (Admin)' })
  @ApiParam({ name: 'id' })
  removeAppointment(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeAppointment(id);
  }

  @Get('reports/summary')
  @ApiOperation({ summary: 'Reports summary (V1 simple)' })
  reports(@Query() q: ReportsQueryDto) {
    return this.admin.reports(q);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Reports (V1 simple, alias of summary)' })
  reportsAlias(@Query() q: ReportsQueryDto) {
    return this.admin.reports(q);
  }

  @Get('settings')
  @ApiOperation({ summary: 'List settings (Admin)' })
  listSettings() {
    return this.admin.listSettings();
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get setting by key (Admin)' })
  @ApiParam({ name: 'key' })
  getSetting(@Param('key') key: string) {
    return this.admin.getSetting(key);
  }

  @Post('settings')
  @ApiOperation({ summary: 'Create setting (Admin)' })
  createSetting(@Body() dto: CreateSettingDto) {
    return this.admin.createSetting(dto);
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update setting (Admin)' })
  @ApiParam({ name: 'key' })
  updateSetting(@Param('key') key: string, @Body() dto: AdminUpdateSettingDto) {
    return this.admin.updateSetting(key, dto);
  }

  @Delete('settings/:key')
  @ApiOperation({ summary: 'Delete setting (Admin)' })
  @ApiParam({ name: 'key' })
  removeSetting(@Param('key') key: string) {
    return this.admin.removeSetting(key);
  }
}
