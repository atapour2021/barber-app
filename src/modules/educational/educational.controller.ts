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
import { Roles, Public } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateEducationalDto } from './dto/create-educational.dto';
import { UpdateEducationalDto } from './dto/update-educational.dto';
import { EducationalService } from './educational.service';

@ApiTags('educational')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('educational')
export class EducationalController {
  constructor(private readonly service: EducationalService) {}
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create educational (Admin only)' })
  create(@Body() dto: CreateEducationalDto) {
    return this.service.create(dto);
  }
  @Public()
  @Get()
  @ApiOperation({ summary: 'List educational (public)' })
  findAll() {
    return this.service.findAll();
  }
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get educational (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update educational (Admin only)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateEducationalDto) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete educational (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
