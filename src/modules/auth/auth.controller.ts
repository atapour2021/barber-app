import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { LoginDto } from 'src/modules/auth/dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('register')
  @ApiTags('auth')
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBody({ type: RegisterDto })
  register(@Body() registerDto: RegisterDto) {
    return { message: 'User registered successfully' };
  }

  @Post('login')
  @ApiTags('auth')
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiBody({ type: LoginDto })
  login(@Body() loginDto: LoginDto) {
    return { message: 'User logged in successfully' };
  }
}