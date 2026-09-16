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
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create certificate (Barber/Admin)' })
  create(@Body() dto: CreateCertificateDto) {
    return this.service.create(dto);
  }
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'List certificates (Barber/Admin)' })
  @ApiQuery({ name: 'barberId', required: false })
  findAll(@Query('barberId') barberId?: string) {
    return this.service.findAll(barberId);
  }
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get certificate (Barber/Admin)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update certificate (Barber/Admin)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete certificate (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
