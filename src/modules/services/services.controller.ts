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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public, CurrentUser } from '../../common/decorators';
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
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create service (Barber/Admin)' })
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }
  @Public()
  @Get()
  @ApiOperation({ summary: 'List services (public)' })
  @ApiQuery({ name: 'barberId', required: false })
  @ApiQuery({ name: 'barbershopId', required: false })
  findAll(
    @Query('barberId') barberId?: string,
    @Query('barbershopId') barbershopId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(barberId, barbershopId, { page, limit });
  }
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get service (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update service (owner/Admin)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete service (owner/Admin)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
