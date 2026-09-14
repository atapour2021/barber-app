import { PartialType } from '@nestjs/swagger';
import { CreateBarbershopDto } from './create-barbershop.dto';
export class UpdateBarbershopDto extends PartialType(CreateBarbershopDto) {}
