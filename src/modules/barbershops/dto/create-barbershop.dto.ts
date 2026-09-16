import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBarbershopDto {
  @ApiProperty({ example: 'Sharp Cuts' }) @IsString() name!: string;
  @ApiProperty({ example: 'Best barbershop in town' })
  @IsString()
  description!: string;
  @ApiProperty({ example: '123 Main St' }) @IsString() address!: string;
  @ApiProperty({ example: 10.762622 }) @IsNumber() latitude!: number;
  @ApiProperty({ example: 106.660172 }) @IsNumber() longitude!: number;
  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
  @ApiPropertyOptional({ example: 'https://cdn/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;
  @ApiProperty({ example: 'uuid' }) @IsUUID() ownerId!: string;
}
