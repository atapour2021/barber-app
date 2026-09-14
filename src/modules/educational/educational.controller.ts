import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateEducationalDto } from './dto/create-educational.dto';
import { UpdateEducationalDto } from './dto/update-educational.dto';
import { EducationalService } from './educational.service';

@ApiTags('educational')
@Controller('educational')
export class EducationalController {
  constructor(private readonly service: EducationalService) {}
  @Post() @ApiOperation({ summary: 'Create educational' }) create(@Body() dto: CreateEducationalDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'List educational' }) findAll() { return this.service.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Get educational' }) @ApiParam({ name: 'id' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update educational' }) @ApiParam({ name: 'id' }) update(@Param('id') id: string, @Body() dto: UpdateEducationalDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Delete educational' }) @ApiParam({ name: 'id' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
