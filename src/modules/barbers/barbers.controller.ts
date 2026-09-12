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

@ApiTags('barbers')
@Controller('barbers')
export class BarbersController {
  @Post()
  @ApiTags('barbers')
  @ApiResponse({ status: 201, description: 'Barber created successfully' })
  @ApiBody({ type: RegisterDto })
  create(@Body() registerDto: RegisterDto) {
    return { message: 'Barber created successfully' };
  }

  @Get()
  @ApiTags('barbers')
  @ApiResponse({ status: 200, description: 'List all barbers' })
  findAll(@Query() query: any) {
    return { barbers: [] };
  }

  @Get(':id')
  @ApiTags('barbers')
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id') id: string) {
    return { id };
  }
}