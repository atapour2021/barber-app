import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BusinessInsightsQueryDto {
  @ApiPropertyOptional({ example: '2026-09-01', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: 30, minimum: 7, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(365)
  days?: number;
}
