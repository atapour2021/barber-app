import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { BarbersService } from './barbers.service';

@ApiTags('barbers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create barber profile (Barber/Admin)' })
  @ApiResponse({ status: 201, description: 'Barber created' })
  create(@Body() dto: CreateBarberDto, @CurrentUser() user: any) {
    return this.barbersService.create(dto, user);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List barbers (public)' })
  @ApiQuery({ name: 'barbershopId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @Query('barbershopId') barbershopId?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.barbersService.findAll(barbershopId, { status, isActive });
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('me')
  @ApiOperation({ summary: 'Get my barber profile' })
  me(@CurrentUser() user: any) {
    return this.barbersService.findMyBarber(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get barber by id (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.barbersService.findOne(id);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update barber (owner/Admin)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBarberDto,
    @CurrentUser() user: any,
  ) {
    return this.barbersService.update(id, dto, user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete barber (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.barbersService.remove(id, user);
  }
}
