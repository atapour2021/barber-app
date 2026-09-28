import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TopupDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1000)
  @Max(100000000)
  amount!: number;
  @ApiPropertyOptional({ example: 'شارژ کیف پول' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class PayDto {
  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(1000)
  @Max(100000000)
  amount!: number;
  @ApiPropertyOptional({ example: 'پرداخت نوبت' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(1000)
  @Max(100000000)
  amount!: number;
  @ApiPropertyOptional({ example: 'برداشت وجه' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class AdminTopupDto {
  @ApiProperty({ example: 'uuid' }) @IsUUID() userId!: string;
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1)
  @Max(100000000)
  amount!: number;
  @ApiPropertyOptional({ example: 'شارژ توسط ادمین' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class AdminAdjustDto {
  @ApiProperty({ example: 'uuid' }) @IsUUID() userId!: string;
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(-100000000)
  @Max(100000000)
  amount!: number;
  @ApiPropertyOptional({ example: 'اصلاح موجودی' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class WalletQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional({
    enum: [
      'topup',
      'payment',
      'refund',
      'payout',
      'adjustment',
      'credit',
      'debit',
    ],
  })
  @IsOptional()
  @IsString()
  type?: string;
  @ApiPropertyOptional({ enum: ['completed', 'pending', 'failed'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminWalletsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional({ example: 'ali' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminTransactionsQueryDto extends WalletQueryDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
