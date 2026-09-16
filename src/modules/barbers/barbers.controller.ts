import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Role } from '../../enums/role';
import { BarbersService } from './barbers.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';

@ApiTags('barbers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create barber (Admin only)' })
  @ApiResponse({ status: 201, description: 'Barber created' })
  create(@Body() dto: CreateBarberDto) { return this.barbersService.create(dto); }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List barbers (public)' })
  @ApiQuery({ name: 'barbershopId', required: false })
  findAll(@Query('barbershopId') barbershopId?: string) { return this.barbersService.findAll(barbershopId); }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get barber by id (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) { return this.barbersService.findOne(id); }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update barber (Barber/Admin)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateBarberDto) { return this.barbersService.update(id, dto); }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete barber (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) { return this.barbersService.remove(id); }
}
