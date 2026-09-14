import { Body, Controller, Get, Param, Post, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { BarbersService } from './barbers.service';

@ApiTags('barbers')
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Post()
  @ApiOperation({ summary: 'Create barber' })
  @ApiResponse({ status: 201, description: 'Barber created' })
  create(@Body() dto: CreateBarberDto) { return this.barbersService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'List barbers' })
  @ApiQuery({ name: 'barbershopId', required: false })
  findAll(@Query('barbershopId') barbershopId?: string) { return this.barbersService.findAll(barbershopId); }

  @Get(':id')
  @ApiOperation({ summary: 'Get barber by id' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) { return this.barbersService.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update barber' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateBarberDto) { return this.barbersService.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete barber' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) { return this.barbersService.remove(id); }
}
