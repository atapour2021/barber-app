import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
  IsObject,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BarberServiceDto {
  @ApiProperty({ example: 'uuid' }) @IsUUID() serviceId!: string;
  @ApiProperty({ example: 25 }) @IsNumber() @Min(0) price!: number;
  @ApiProperty({ example: 30 }) @IsNumber() @Min(1) duration!: number;
}

class WorkingHourDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;
  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export class CreateBarberDto {
  @ApiProperty({ example: 'John Doe' }) @IsString() fullName!: string;
  @ApiPropertyOptional({ example: 'Expert in fades' })
  @IsOptional()
  @IsString()
  bio?: string;
  @ApiPropertyOptional({ example: 'https://cdn/img.png' })
  @IsOptional()
  @IsString()
  profileImage?: string;
  @ApiPropertyOptional({ example: ['fade', 'beard'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];
  @ApiPropertyOptional({
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(DAYS as any, { each: true })
  workingDays?: string[];
  @ApiPropertyOptional({
    example: { monday: { start: '09:00', end: '18:00' } },
  })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, WorkingHourDto>;
  @ApiPropertyOptional({ example: ['2026-03-21'] })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  holidays?: string[];
  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional({
    example: [{ serviceId: 'uuid', price: 25, duration: 30 }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BarberServiceDto)
  services?: BarberServiceDto[];
  @ApiProperty({ example: 'uuid' }) @IsUUID() barbershopId!: string;
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
