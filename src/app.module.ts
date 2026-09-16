import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import {
  AppointmentsModule,
  AvailabilityModule,
  BarbershopsModule,
  BarbersModule,
  CertificatesModule,
  EducationalModule,
  ServicesModule,
  UploadsModule,
  UsersModule,
  AuthModule,
} from './modules';

@Module({
  imports: [
    UsersModule,
    BarbershopsModule,
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    AvailabilityModule,
    EducationalModule,
    CertificatesModule,
    UploadsModule,
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
