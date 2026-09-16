import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({ example: 'Barber Master' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({ example: 'Academy' })
  @IsString()
  @Length(1, 200)
  issuer!: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  barberId!: string;
}
