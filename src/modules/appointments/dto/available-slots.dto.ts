import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AvailableSlotsQueryDto {
  @ApiProperty({ example: 'uuid' }) @IsUUID() barberId!: string;
  @ApiProperty({ example: '2026-09-20' }) @IsDateString() date!: string;
  @ApiPropertyOptional({ example: 'uuid' }) @IsOptional() @IsUUID() serviceId?: string;
}
