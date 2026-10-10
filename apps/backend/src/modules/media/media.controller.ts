import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  Query,
  Logger,
  UseGuards,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media } from './entities/media.entity';
import { MediaType, StorageType, MediaModule, MediaCategory } from '@affexai/shared-types';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { validateMediaMetadata, validateRasterUpload, RasterUpload } from './media-upload-policy';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a media entry' })
  create(@Body() createMediaDto: CreateMediaDto): Promise<Media> {
    validateMediaMetadata(createMediaDto);
    return this.mediaService.create(createMediaDto);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Find media with advanced filters' })
  findWithFilters(
    @Query('type') type?: string,
    @Query('module') module?: MediaModule,
    @Query('category') category?: MediaCategory,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Media[]; total: number } | Media[]> {
    return this.mediaService.findWithFilters({
      type: type as MediaType,
      module,
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all media files' })
  findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get module counts' })
  getModulesWithCount() {
    return this.mediaService.getModulesWithCount();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category counts' })
  getCategoriesWithCount() {
    return this.mediaService.getCategoriesWithCount();
  }

  @Get('by-module/:module')
  @ApiOperation({ summary: 'Find by module' })
  findByModule(@Param('module') module: MediaModule): Promise<Media[]> {
    return this.mediaService.findByModule(module);
  }

  @Get('by-category/:category')
  @ApiOperation({ summary: 'Find by category' })
  findByCategory(@Param('category') category: MediaCategory): Promise<Media[]> {
    return this.mediaService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one media entry' })
  findOne(@Param('id') id: string): Promise<Media> {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media' })
  update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<Media> {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  remove(@Param('id') id: string): Promise<void> {
    return this.mediaService.remove(id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to S3' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new BadRequestException('Only raster images are accepted'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: RasterUpload,
    @CurrentUser() user: { tenantId?: string },
    @Query('module') module?: MediaModule,
    @Query('category') category?: MediaCategory,
    @Query('tags') tags?: string,
  ) {
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const validated = validateRasterUpload(file);
    if (module && !Object.values(MediaModule).includes(module)) throw new BadRequestException('Invalid media module');
    if (category && !Object.values(MediaCategory).includes(category)) throw new BadRequestException('Invalid media category');
    if (tags && (tags.length > 2048 || tags.split(',').length > 30)) throw new BadRequestException('Too many media tags');
    const tenantId = user?.tenantId;
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) throw new BadRequestException('Tenant is required');
    const filename = `${uuidv4()}${validated.extension}`;
    const uploadPath = module ? `${module.toLowerCase()}${category ? '/' + category.toLowerCase() : ''}` : 'uploads';

    let fileUrl: string;
    try {
      fileUrl = await this.s3Service.uploadFile(
        filename,
        file.buffer,
        validated.mimeType,
        tenantId,
        {
          path: uploadPath,
          acl: 'public-read',
          metadata: {
            originalName: file.originalname,
            module: module ? module.toString() : 'general',
          }
        }
      );
    } catch (error) {
      this.logger.error('Media storage upload failed');
      throw new ServiceUnavailableException('Media storage is unavailable');
    }

    const createMediaDto: CreateMediaDto = {
      filename: filename,
      originalName: file.originalname,
      mimeType: validated.mimeType,
      size: file.buffer.length,
      url: fileUrl,
      type: MediaType.IMAGE,
      storageType: StorageType.S3,
      module: module || MediaModule.GENERAL,
      category: category || MediaCategory.OTHER,
      tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
      isActive: true,
    };

    return this.mediaService.createFromUpload(createMediaDto, tenantId);
  }
}