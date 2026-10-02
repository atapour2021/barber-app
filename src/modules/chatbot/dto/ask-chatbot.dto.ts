import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AskChatbotDto {
  @ApiProperty({ example: 'چطور نوبت رزرو کنم؟' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional({ example: 'customer', enum: ['customer', 'barber', 'admin'] })
  @IsOptional()
  @IsString()
  @IsIn(['customer', 'barber', 'admin'])
  role?: 'customer' | 'barber' | 'admin';
}
