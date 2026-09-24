import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../enums/role';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({ status: 200, description: 'Current user' })
  getMe(@CurrentUser() user: any) {
    return this.usersService.getMe(user.id ?? user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiBody({ type: UpdateProfileDto })
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user.id ?? user.sub, dto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload my avatar' })
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
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: any) {
    const url = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateMe(user.id ?? user.sub, {
      profileImage: url,
    });
    return this.usersService.getMe(user.id ?? user.sub);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBody({ type: RegisterDto })
  create(@Body() dto: RegisterDto) {
    return { message: 'User created successfully', dto };
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get my preferences' })
  @ApiResponse({ status: 200, description: 'Preferences' })
  getPreferences(@CurrentUser() user: any) {
    return this.usersService.getPreferences(user.id ?? user.sub);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update my preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiBody({ type: UpdatePreferencesDto })
  updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(user.id ?? user.sub, dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (Admin only)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
