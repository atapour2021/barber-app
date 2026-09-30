import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { WalletModule } from './modules/wallet/wallet.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
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
    WalletModule,
    AiModule,
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
