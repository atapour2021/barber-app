import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
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
import { memoryStorage } from 'multer';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('hair-style/recommend')
  @ApiOperation({ summary: 'AI hair style recommendation from face photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
      required: ['image'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, f, cb) => {
        if (!f.mimetype?.startsWith('image/'))
          return cb(new Error('only images allowed'), false);
        const ok = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/jpg',
        ].includes(f.mimetype);
        if (!ok && !f.mimetype.startsWith('image/'))
          return cb(new Error('only images allowed'), false);
        cb(null, true);
      },
    }),
  )
  async recommend(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('image required');
    const res = await this.ai.recommend(file.buffer, file.mimetype);
    return res;
  }
}
