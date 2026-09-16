import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationDispatcher } from './notifications.dispatcher';
import { InAppChannel } from './channels/in-app.channel';

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Appointment, Barber]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'barber_secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    InAppChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (inApp: InAppChannel) => [inApp] as any,
      inject: [InAppChannel],
    },
    NotificationDispatcher,
    NotificationsService,
    NotificationsListener,
    NotificationsScheduler,
  ],
  exports: [NotificationsService, NotificationDispatcher, NOTIFICATION_CHANNELS],
})
export class NotificationsModule {}
