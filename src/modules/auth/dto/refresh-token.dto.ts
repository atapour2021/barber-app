import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJ... or opaque token' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
