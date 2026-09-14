import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { UploadsService } from './uploads.service';
import * as path from 'path';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}
  @Post()
  @ApiOperation({ summary: 'Upload file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: './uploads', filename: (_req, f, cb) => cb(null, `${Date.now()}${path.extname(f.originalname)}`) }) }))
  upload(@UploadedFile() file: any) { return this.service.handle(file); }
}
