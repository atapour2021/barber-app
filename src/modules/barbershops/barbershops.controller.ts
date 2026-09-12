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

@ApiTags('barbershops')
@Controller('barbershops')
export class BarbershopsController {
  @Post()
  @ApiTags('barbershops')
  @ApiResponse({ status: 201, description: 'Barbershop created successfully' })
  @ApiBody({ type: RegisterDto })
  create(@Body() registerDto: RegisterDto) {
    return { message: 'Barbershop created successfully' };
  }

  @Get()
  @ApiTags('barbershops')
  @ApiResponse({ status: 200, description: 'List all barbershops' })
  findAll(@Query() query: any) {
    return { barbershops: [] };
  }

  @Get(':id')
  @ApiTags('barbershops')
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id') id: string) {
    return { id };
  }
}