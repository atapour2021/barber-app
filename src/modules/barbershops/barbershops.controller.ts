import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';
import { BarbershopsService } from './barbershops.service';

@ApiTags('barbershops')
@Controller('barbershops')
export class BarbershopsController {
  constructor(private readonly service: BarbershopsService) {}
  @Post() @ApiOperation({ summary: 'Create barbershop' }) @ApiResponse({ status: 201 }) create(@Body() dto: CreateBarbershopDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'List barbershops' }) findAll() { return this.service.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Get barbershop' }) @ApiParam({ name: 'id' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update barbershop' }) @ApiParam({ name: 'id' }) update(@Param('id') id: string, @Body() dto: UpdateBarbershopDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Delete barbershop' }) @ApiParam({ name: 'id' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
