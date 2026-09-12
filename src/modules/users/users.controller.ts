import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { LoginDto } from 'src/modules/auth/dto/login.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Post()
  @ApiTags('users')
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBody({ type: RegisterDto })
  create(@Body() registerDto: RegisterDto) {
    return { message: 'User created successfully' };
  }

  @Get()
  @ApiTags('users')
  @ApiResponse({ status: 200, description: 'List all users' })
  findAll(@Query() query: any) {
    return { users: [] };
  }

  @Get(':id')
  @ApiTags('users')
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id') id: string) {
    return { id };
  }
}