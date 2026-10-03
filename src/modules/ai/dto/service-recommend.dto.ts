import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HairstyleInputDto {
  @ApiPropertyOptional({ example: 'fade-classic' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'Classic Fade' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'فید کلاسیک' })
  @IsOptional()
  @IsString()
  titleFa?: string;

  @ApiPropertyOptional({ example: 'fade' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'short', enum: ['short', 'medium', 'long'] })
  @IsOptional()
  @IsIn(['short', 'medium', 'long'] as const)
  length?: string;

  @ApiPropertyOptional({ example: ['fade', 'short'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ServiceRecommendDto {
  @ApiPropertyOptional({ example: 'fade-classic' })
  @IsOptional()
  @IsString()
  hairstyleId?: string;

  @ApiPropertyOptional({ type: HairstyleInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HairstyleInputDto)
  hairstyle?: HairstyleInputDto;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  barbershopId?: string;
}
