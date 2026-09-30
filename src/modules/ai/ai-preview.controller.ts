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
import { Body } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiPreviewController {
  constructor(private readonly ai: AiService) {}

  @Roles(Role.CUSTOMER, Role.USER, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('hair-style/preview')
  @ApiOperation({
    summary: 'AI hair preview — edit hairstyle only, preserve face identity',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        recommendationId: { type: 'string' },
        title: { type: 'string' },
        titleFa: { type: 'string' },
        category: { type: 'string' },
        length: { type: 'string', enum: ['short', 'medium', 'long'] },
      },
      required: ['image', 'recommendationId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, f, cb) => {
        if (!f.mimetype?.startsWith('image/'))
          return cb(new Error('only images allowed'), false);
        cb(null, true);
      },
    }),
  )
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('recommendationId') recommendationId: string,
    @Body('title') title?: string,
    @Body('titleFa') titleFa?: string,
    @Body('category') category?: string,
    @Body('length') length?: string,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('image required');
    if (!recommendationId)
      throw new BadRequestException('recommendationId required');
    const rec = {
      id: recommendationId,
      title,
      titleFa,
      category,
      length: (length as any) ?? 'medium',
    } as any;
    return this.ai.preview(file.buffer, file.mimetype, rec);
  }
}
