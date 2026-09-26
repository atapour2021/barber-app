import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Post()
  @ApiOperation({
    summary: 'Create location (barberId or userId, exactly one)',
  })
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List locations (public)' })
  @ApiQuery({ name: 'barberId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query('barberId') barberId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(barberId, userId, { page, limit });
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Get('mine')
  @ApiOperation({ summary: 'List own locations' })
  findMine(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findMine(user, { page, limit });
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Get('me')
  @ApiOperation({ summary: 'List own locations (alias for mine)' })
  findMe(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findMine(user, { page, limit });
  }

  @Public()
  @Get('barber/:barberId')
  @ApiOperation({ summary: 'Get barber location for map (public)' })
  @ApiParam({ name: 'barberId' })
  findByBarberId(@Param('barberId') barberId: string) {
    return this.service.findByBarberId(barberId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List user locations' })
  @ApiParam({ name: 'userId' })
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get location (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update location (owner/Admin)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete location (owner/Admin)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
