import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'Please be on time' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
