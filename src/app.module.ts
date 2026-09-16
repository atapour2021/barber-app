import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ global: true }),
    UsersModule,
    BarbershopsModule,
    BarbersModule,
    ServicesModule,
    AppointmentsModule,
    AvailabilityModule,
    EducationalModule,
    CertificatesModule,
    UploadsModule,
    NotificationsModule,
    AdminModule,
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
