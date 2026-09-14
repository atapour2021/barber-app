import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';

export class CreateBarberDto {
  @ApiProperty({ example: 'John Doe' }) @IsString() fullName!: string;
  @ApiPropertyOptional({ example: 'Expert in fades' }) @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional({ example: 'https://cdn/img.png' }) @IsOptional() @IsString() profileImage?: string;
  @ApiPropertyOptional({ example: ['fade', 'beard'] }) @IsOptional() @IsArray() specialties?: string[];
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isAvailable?: boolean;
  @ApiProperty({ example: 'uuid' }) @IsUUID() barbershopId!: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() userId!: string;
}
