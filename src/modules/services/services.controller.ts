import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) @Post() @ApiOperation({ summary: 'Create service (Admin only)' }) create(@Body() dto: CreateServiceDto) { return this.service.create(dto); }
  @Public() @Get() @ApiOperation({ summary: 'List services (public)' }) @ApiQuery({ name: 'barbershopId', required: false }) findAll(@Query('barbershopId') barbershopId?: string) { return this.service.findAll(barbershopId); }
  @Public() @Get(':id') @ApiOperation({ summary: 'Get service (public)' }) @ApiParam({ name: 'id' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) @Patch(':id') @ApiOperation({ summary: 'Update service (Admin only)' }) @ApiParam({ name: 'id' }) update(@Param('id') id: string, @Body() dto: UpdateServiceDto) { return this.service.update(id, dto); }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) @Delete(':id') @ApiOperation({ summary: 'Delete service (Admin only)' }) @ApiParam({ name: 'id' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
