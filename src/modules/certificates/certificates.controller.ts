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
  create(@Body() dto: CreateCertificateDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List certificates (public)' })
  @ApiQuery({ name: 'barberId', required: false })
  findAll(@Query('barberId') barberId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(barberId, { page, limit });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get certificate (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update certificate (owner/Admin)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCertificateDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete certificate (owner/Admin)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
