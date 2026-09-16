import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { UploadsService } from './uploads.service';
import * as path from 'path';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}
  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Upload file (authenticated)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, f, cb) =>
          cb(null, `${Date.now()}${path.extname(f.originalname)}`),
      }),
    }),
  )
  upload(@UploadedFile() file: any) {
    return this.service.handle(file);
  }
}
