import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
export class CreateEducationalDto {
  @ApiProperty({ example: 'Barber Course' }) @IsString() title!: string;
  @ApiPropertyOptional({ example: 'Learn fades' }) @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ example: '2024-01-01' }) @IsOptional() @IsDateString() startDate?: string;
}
