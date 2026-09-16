import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { RegisterDto } from '../auth/dto/register.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBody({ type: RegisterDto })
  create(@Body() dto: RegisterDto) {
    return { message: 'User created successfully', dto };
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (Admin only)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
