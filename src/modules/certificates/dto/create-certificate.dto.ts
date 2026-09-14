import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
export class CreateCertificateDto {
  @ApiProperty({ example: 'Barber Master' }) @IsString() name!: string;
  @ApiProperty({ example: 'Academy' }) @IsString() issuer!: string;
  @ApiProperty({ example: '2024-01-01' }) @IsDateString() issueDate!: string;
  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsDateString() expiryDate?: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() barberId!: string;
}
