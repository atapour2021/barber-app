import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { UpdateBarbershopDto } from './dto/update-barbershop.dto';
import { BarbershopsService } from './barbershops.service';

@ApiTags('barbershops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('barbershops')
export class BarbershopsController {
  constructor(private readonly service: BarbershopsService) {}
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create barbershop (Admin only)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateBarbershopDto) {
    return this.service.create(dto);
  }
  @Public()
  @Get()
  @ApiOperation({ summary: 'List barbershops (public)' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll({ page, limit });
  }
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get barbershop (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update barbershop (Admin only)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateBarbershopDto) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete barbershop (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
