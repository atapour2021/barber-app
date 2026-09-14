import { PartialType } from '@nestjs/swagger';
import { CreateEducationalDto } from './create-educational.dto';
export class UpdateEducationalDto extends PartialType(CreateEducationalDto) {}
