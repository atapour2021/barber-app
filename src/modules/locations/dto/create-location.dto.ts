import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min, Length } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: '123 Main St, City' })
  @IsString()
  @Length(1, 500)
  address!: string;

  @ApiProperty({ example: 10.762622 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 106.660172 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ example: { placeId: 'ChIJ...', zoom: 15 } })
  @IsOptional()
  @IsObject()
  mapMetadata?: Record<string, any>;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  barberId!: string;
}
