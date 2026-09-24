import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
import { LocationsModule } from './modules/locations/locations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'uploads'), serveRoot: '/uploads' }),
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
    LocationsModule,
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
