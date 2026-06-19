import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BarbershopsModule } from './modules/barbershops/barbershops.module';
import { BarbersModule } from './modules/barbers/barbers.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { EducationalModule } from './modules/educational/educational.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [AuthModule, UsersModule, BarbershopsModule, BarbersModule, ServicesModule, AppointmentsModule, EducationalModule, CertificatesModule, UploadsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
