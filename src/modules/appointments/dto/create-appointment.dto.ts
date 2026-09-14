import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppointmentStatus } from 'src/enums/appointment-status';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2026-09-15' }) @IsDateString() date!: string;
  @ApiProperty({ example: '2026-09-15T09:00:00.000Z' }) @IsDateString() startTime!: string;
  @ApiProperty({ example: '2026-09-15T10:00:00.000Z' }) @IsDateString() endTime!: string;
  @ApiPropertyOptional({ enum: AppointmentStatus, example: AppointmentStatus.PENDING }) @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
  @ApiPropertyOptional({ example: 'First visit' }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() userId!: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() barberId!: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() serviceId!: string;
}
