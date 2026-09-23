import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: ['light', 'dark'], example: 'dark' })
  @IsOptional()
  @IsIn(['light', 'dark'])
  themePreference?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smsReminder?: boolean;
}
