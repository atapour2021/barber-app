import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateEducationalDto } from './dto/create-educational.dto';
import { UpdateEducationalDto } from './dto/update-educational.dto';
import { EducationalService } from './educational.service';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ALLOWED_MIMES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
];

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = './uploads/educational';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safeExt = extname(file.originalname)
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '');
    const allowedExt = [
      '.mp4',
      '.webm',
      '.ogg',
      '.mov',
      '.avi',
      '.mkv',
      '.mpeg',
      '.mpg',
      '.3gp',
    ];
    const ext = allowedExt.includes(safeExt) ? safeExt : '.mp4';
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: any) {
  const ok =
    ALLOWED_MIMES.includes(file.mimetype) || file.mimetype.startsWith('video/');
  if (!ok)
    return cb(new Error(`unsupported video type ${file.mimetype}`), false);
  const ext = extname(file.originalname).toLowerCase();
  if (['.exe', '.sh', '.js', '.html', '.php'].includes(ext))
    return cb(new Error('invalid file extension'), false);
  cb(null, true);
}

@ApiTags('educational')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('educational')
export class EducationalController {
  constructor(private readonly service: EducationalService) {}

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create educational (Barber/Admin) with optional video',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        barberId: { type: 'string', format: 'uuid' },
        startDate: { type: 'string', format: 'date' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'barberId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateEducationalDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(dto, user, file);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List educationals (public)' })
  @ApiQuery({ name: 'barberId', required: false })
  findAll(@Query('barberId') barberId?: string) {
    return this.service.findAll(barberId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get educational (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update educational (owner/Admin)' })
  @ApiParam({ name: 'id' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEducationalDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, user, file);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/video')
  @ApiOperation({ summary: 'Upload/replace educational video (owner/Admin)' })
  @ApiParam({ name: 'id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  uploadVideo(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadVideo(id, user, file);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete educational (owner/Admin)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
