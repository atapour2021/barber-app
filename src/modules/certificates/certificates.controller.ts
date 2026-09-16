import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}
  @Post() @ApiOperation({ summary: 'Create certificate' }) create(@Body() dto: CreateCertificateDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'List certificates' }) @ApiQuery({ name: 'barberId', required: false }) findAll(@Query('barberId') barberId?: string) { return this.service.findAll(barberId); }
  @Get(':id') @ApiOperation({ summary: 'Get certificate' }) @ApiParam({ name: 'id' }) findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update certificate' }) @ApiParam({ name: 'id' }) update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) { return this.service.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Delete certificate' }) @ApiParam({ name: 'id' }) remove(@Param('id') id: string) { return this.service.remove(id); }
}
