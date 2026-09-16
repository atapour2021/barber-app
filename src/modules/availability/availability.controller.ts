import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AvailabilityService } from './availability.service';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Get bookable slots (Working Days / Hours + Break Time + Appointments)',
  })
  @ApiQuery({ name: 'barberId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-09-20' })
  @ApiQuery({ name: 'serviceId', required: false })
  getAvailability(
    @Query('barberId') barberId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.service.getAvailability(barberId, date, serviceId);
  }
}
