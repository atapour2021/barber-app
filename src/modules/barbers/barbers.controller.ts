import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { Role } from '../../enums/role';
import { CreateBarberDto } from './dto/create-barber.dto';
import { UpdateBarberDto } from './dto/update-barber.dto';
import { BarbersService } from './barbers.service';

@ApiTags('barbers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create barber profile (Barber/Admin)' })
  @ApiResponse({ status: 201, description: 'Barber created' })
  create(@Body() dto: CreateBarberDto, @CurrentUser() user: any) {
    return this.barbersService.create(dto, user);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List barbers (public)' })
  @ApiQuery({ name: 'barbershopId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @Query('barbershopId') barbershopId?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.barbersService.findAll(barbershopId, { status, isActive });
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('me')
  @ApiOperation({ summary: 'Get my barber profile' })
  me(@CurrentUser() user: any) {
    return this.barbersService.findMyBarber(user.id ?? user.sub);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('me')
  @ApiOperation({ summary: 'Update my barber profile' })
  updateMe(@Body() dto: UpdateBarberDto, @CurrentUser() user: any) {
    return this.barbersService.updateMyBarber(user.id ?? user.sub, dto, user);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload my barber avatar' })
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
        destination: (_req, _f, cb) => {
          const dir = './uploads/avatars';
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, f, cb) =>
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(f.originalname)}`,
          ),
      }),
      fileFilter: (_req, f, cb) => {
        if (!f.mimetype.startsWith('image/'))
          return cb(new Error('only images allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadMyAvatar(@CurrentUser() user: any, @UploadedFile() file: any) {
    const url = `/uploads/avatars/${file.filename}`;
    const me = await this.barbersService.findMyBarber(user.id ?? user.sub);
    return this.barbersService.update(me.id, { profileImage: url }, user);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload barber avatar by id (owner/Admin)' })
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
        destination: (_req, _f, cb) => {
          const dir = './uploads/avatars';
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, f, cb) =>
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(f.originalname)}`,
          ),
      }),
      fileFilter: (_req, f, cb) => {
        if (!f.mimetype.startsWith('image/'))
          return cb(new Error('only images allowed'), false);
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: any,
  ) {
    const url = `/uploads/avatars/${file.filename}`;
    return this.barbersService.update(id, { profileImage: url }, user);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get barber by id (public)' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.barbersService.findOne(id);
  }

  @Roles(Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update barber (owner/Admin)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBarberDto,
    @CurrentUser() user: any,
  ) {
    return this.barbersService.update(id, dto, user);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete barber (Admin only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.barbersService.remove(id, user);
  }
}
