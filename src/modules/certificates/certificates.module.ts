import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, Barber])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
