import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from 'src/enums/appointment-status';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
