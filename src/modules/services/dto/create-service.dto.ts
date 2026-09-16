import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut' }) @IsString() name!: string;
  @ApiProperty({ example: 'Classic haircut' }) @IsString() description!: string;
  @ApiProperty({ example: 25 }) @IsNumber() price!: number;
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  duration?: number;
  @ApiPropertyOptional({ example: 'scissors' })
  @IsOptional()
  @IsString()
  icon?: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() barbershopId!: string;
}
