import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { KnowledgeSourcesService } from '../services/knowledge-sources.service';
import { CreateKnowledgeSourceDto } from '../dto/create-knowledge-source.dto';
import { UpdateKnowledgeSourceDto } from '../dto/update-knowledge-source.dto';
import { QueryKnowledgeSourceDto } from '../dto/query-knowledge-source.dto';
import { SearchKnowledgeSourceDto } from '../dto/search-knowledge-source.dto';
import { S3Service } from '../../media/s3.service';

@Controller('knowledge-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.SUPPORT_MANAGER)
export class KnowledgeSourcesController {
  private readonly logger = new Logger(KnowledgeSourcesController.name);

  constructor(
    private readonly knowledgeSourcesService: KnowledgeSourcesService,
    private readonly s3Service: S3Service,
  ) { }

  /**
   * Create a new knowledge source
   * POST /knowledge-sources
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateKnowledgeSourceDto,
    @CurrentUser() user: any,
  ) {
    const tenantId = this.requireTenant(user);
    this.logger.log(`Creating knowledge source: ${createDto.title} by user: ${user?.id}`);
    if (!user?.id) {
      this.logger.error('User ID not found in request', user);
      throw new Error('Authentication user ID missing');
    }
    const { tenantId: _ignoredTenantId, ...safeCreateDto } = createDto as CreateKnowledgeSourceDto & {
      tenantId?: string;
    };
    const source = await this.knowledgeSourcesService.create(tenantId, {
      ...safeCreateDto,
      uploadedById: user.id,
    });
    return {
      success: true,
      data: source,
      message: 'Knowledge source created successfully',
    };
  }

  /**
   * Upload a file (PDF, DOC, etc.)
   * POST /knowledge-sources/upload
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|txt|md/;
        const ext = extname(file.originalname).toLowerCase().replace('.', '');
        const mimeType = file.mimetype;

        if (allowedTypes.test(ext) || mimeType.includes('pdf') || mimeType.includes('document')) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any, // any to support file.buffer
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const tenantId = this.requireTenant(user);
    if (!file) {
      throw new Error('No file uploaded');
    }

    this.logger.log(`Uploading file: ${file.originalname} by user: ${user?.id}`);

    // Upload to S3
    const uniqueSuffix = uuidv4();
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;

    // Use a specific folder for knowledge sources
    // S3Service generates key as `${Date.now()}-${filename}`.
    // We can just pass the filename, s3Service will handle it.
    // If we want "knowledge-sources/" prefix, we might need to modify S3Service or pass it in filename?
    // S3Service: `const key = \`\${Date.now()}-\${fileName}\`;`
    // So if we pass `knowledge-sources/myfile.pdf`, it becomes `timestamp-knowledge-sources/myfile.pdf`.
    // It handles slashes fine usually. Let's try passing prefix.
    const s3FileName = `knowledge-sources/${filename}`;

    let fileUrl: string;
    try {
      fileUrl = await this.s3Service.uploadFile(s3FileName, file.buffer, file.mimetype, tenantId);
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error.message}`);
      throw new Error('Failed to upload file to storage');
    }

    // Parse tags if provided as JSON string
    let tags = [];
    if (body.tags) {
      try {
        tags = JSON.parse(body.tags);
      } catch {
        tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    // Create DTO from form data
    const createDto: CreateKnowledgeSourceDto = {
      title: body.title || file.originalname,
      description: body.description,
      sourceType: 'document' as any,
      filePath: fileUrl, // Save S3 URL here
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      tags,
      enableForFaqLearning: body.enableForFaqLearning === 'true',
      enableForChat: body.enableForChat === 'true',
      uploadedById: user?.id,
    };

    if (!createDto.uploadedById) {
      this.logger.error('User ID not found in request', user);
      throw new Error('Authentication user ID missing');
    }

    const source = await this.knowledgeSourcesService.create(tenantId, createDto);
    return {
      success: true,
      data: source,
      message: 'File uploaded successfully',
    };
  }

  /**
   * Get all knowledge sources with filtering
   * GET /knowledge-sources
   */
  @Get()
  async findAll(@Query() queryDto: QueryKnowledgeSourceDto, @CurrentUser() user: any) {
    const result = await this.knowledgeSourcesService.findAll(this.requireTenant(user), queryDto);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: Math.floor((queryDto.offset || 0) / (queryDto.limit || 20)) + 1,
      limit: queryDto.limit || 20,
    };
  }

  /**
   * Search knowledge sources with full-text search
   * POST /knowledge-sources/search
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body() searchDto: SearchKnowledgeSourceDto, @CurrentUser() user: any) {
    this.logger.log(`Searching knowledge sources: "${searchDto.query}"`);
    const results = await this.knowledgeSourcesService.search(this.requireTenant(user), searchDto);
    return {
      success: true,
      data: results,
      total: results.length,
    };
  }

  /**
   * Get knowledge source by ID
   * GET /knowledge-sources/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const source = await this.knowledgeSourcesService.findById(this.requireTenant(user), id);
    return {
      success: true,
      data: source,
    };
  }

  /**
   * Update knowledge source
   * PUT /knowledge-sources/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateKnowledgeSourceDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Updating knowledge source: ${id}`);
    const source = await this.knowledgeSourcesService.update(this.requireTenant(user), id, updateDto);
    return {
      success: true,
      data: source,
      message: 'Knowledge source updated successfully',
    };
  }

  /**
   * Archive knowledge source (soft delete)
   * PUT /knowledge-sources/:id/archive
   */
  @Put(':id/archive')
  async archive(@Param('id') id: string, @CurrentUser() user: any) {
    const tenantId = this.requireTenant(user);
    if (!user?.id) throw new BadRequestException('Authenticated user ID required');
    this.logger.log(`Archiving knowledge source: ${id}`);
    const source = await this.knowledgeSourcesService.archive(tenantId, id, user.id);
    return {
      success: true,
      data: source,
      message: 'Knowledge source archived successfully',
    };
  }

  /**
   * Delete knowledge source permanently
   * DELETE /knowledge-sources/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    this.logger.log(`Deleting knowledge source: ${id}`);
    await this.knowledgeSourcesService.delete(this.requireTenant(user), id);
  }

  /**
   * Update usage statistics
   * POST /knowledge-sources/:id/usage
   */
  @Post(':id/usage')
  @HttpCode(HttpStatus.OK)
  async updateUsage(
    @Param('id') id: string,
    @Body('wasHelpful') wasHelpful: boolean,
    @Body('relevanceScore') relevanceScore?: number,
    @CurrentUser() user?: any,
  ) {
    await this.knowledgeSourcesService.updateUsageStats(this.requireTenant(user), id, wasHelpful, relevanceScore);
    return {
      success: true,
      message: 'Usage statistics updated successfully',
    };
  }

  /**
   * Get statistics
   * GET /knowledge-sources/stats/overview
   */
  @Get('stats/overview')
  async getStatistics(@CurrentUser() user: any) {
    const stats = await this.knowledgeSourcesService.getStatistics(this.requireTenant(user));
    return {
      success: true,
      data: stats,
    };
  }

  private requireTenant(user: any): string {
    const tenantId = user?.tenantId;
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) {
      throw new BadRequestException('Tenant context required');
    }
    return tenantId;
  }
}
