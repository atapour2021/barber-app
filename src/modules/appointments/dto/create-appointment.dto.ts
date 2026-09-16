import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid' }) @IsUUID() barberId!: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() serviceId!: string;
  @ApiProperty({ example: '2026-09-20' }) @IsDateString() date!: string;
  @ApiProperty({ example: '2026-09-20T09:00:00.000Z' }) @IsDateString() startTime!: string;
  @ApiProperty({ example: '2026-09-20T09:30:00.000Z' }) @IsDateString() endTime!: string;
  @ApiPropertyOptional({ example: 'First visit' }) @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
