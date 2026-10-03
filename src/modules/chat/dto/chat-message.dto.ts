import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
  @IsOptional()
  history?: Array<{ role: string; text: string }>;
}
