import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
import { Role } from '../../../enums/role';

export class RegisterDto {
  @ApiProperty({ example: '0012345679', description: 'National code (10 digits)' })
  @IsString()
  @Length(10, 10)
  @Matches(/^\d{10}$/, { message: 'nationalCode must be 10 digits' })
  nationalCode!: string;

  @ApiProperty({ example: 'Ali' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Ahmadi' })
  @IsString()
  @IsNotEmpty()
  family!: string;

  @ApiProperty({ example: 'ali_ahmadi' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'phoneNumber must be valid (09xxxxxxxxx)' })
  phoneNumber!: string;

  @ApiPropertyOptional({ example: 'avatar.png' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.CUSTOMER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
