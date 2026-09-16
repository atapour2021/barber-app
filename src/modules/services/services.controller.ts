import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}
  @Post() @ApiOperation({ summary: 'Create service' }) create(@Body() dto: CreateServiceDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'List services' }) @ApiQuery({ name: 'barbershopId', required: false }) findAll(@Query('barbershopId') barbershopId?: string) { return this.service.findAll(barbershopId); }
  @Get(':id') @ApiOperation({ summary: 'Get service' }) @ApiParam({ name: 'id' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update service' }) @ApiParam({ name: 'id' }) update(@Param('id') id: string, @Body() dto: UpdateServiceDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Delete service' }) @ApiParam({ name: 'id' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
