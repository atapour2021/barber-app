import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '../../../enums/role';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ example: 'Ali' })
  @IsOptional()
  @IsString()
  name?: string;
  @ApiPropertyOptional({ example: 'Ahmadi' })
  @IsOptional()
  @IsString()
  family?: string;
  @ApiPropertyOptional({ example: 'ali_new' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;
  @ApiPropertyOptional({ example: '09123456789' })
  @IsOptional()
  @IsString()
  @Matches(/^09\d{9}$/)
  phoneNumber?: string;
  @ApiPropertyOptional({ example: 'ali@test.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
  @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUpdateSettingDto {
  @ApiPropertyOptional({ example: 'some value' })
  @IsOptional()
  @IsString()
  value?: string;
  @ApiPropertyOptional({ example: 'description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSettingDto {
  @ApiPropertyOptional({ example: 'site_name' }) @IsString() key!: string;
  @ApiPropertyOptional({ example: 'Barber App' })
  @IsOptional()
  @IsString()
  value?: string;
  @ApiPropertyOptional({ example: 'Site display name' })
  @IsOptional()
  @IsString()
  description?: string;
}
