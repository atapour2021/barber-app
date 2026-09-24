import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ali' }) @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ example: 'Ahmadi' }) @IsOptional() @IsString() family?: string;
  @ApiPropertyOptional({ example: '09123456789' }) @IsOptional() @IsString() @Matches(/^09\d{9}$/, { message: 'phoneNumber must be valid (09xxxxxxxxx)' }) phoneNumber?: string;
  @ApiPropertyOptional({ example: 'ali@test.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ example: '/uploads/avatar.png' }) @IsOptional() @IsString() profileImage?: string;
}
