import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
  @ApiPropertyOptional({ example: 'ali' })
  @IsOptional()
  @IsString()
  search?: string;
  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class UsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'customer' })
  @IsOptional()
  @IsString()
  role?: string;
  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}

export class BarbersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;
  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  barbershopId?: string;
}

export class ServicesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  barberId?: string;
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  barbershopId?: string;
}

export class AppointmentsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
  })
  @IsOptional()
  @IsString()
  status?: string;
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  barberId?: string;
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  from?: string;
  @ApiPropertyOptional({ example: '2026-09-16' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class ReportsQueryDto {
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  from?: string;
  @ApiPropertyOptional({ example: '2026-09-16' })
  @IsOptional()
  @IsString()
  to?: string;
}
