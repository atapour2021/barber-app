import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Classic haircut with styling' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({ example: 'scissors' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Barber ID (auto-resolved from auth if omitted)',
  })
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  barbershopId?: string;
}
