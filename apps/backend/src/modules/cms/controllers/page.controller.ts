import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { IsArray, IsString, IsEnum } from 'class-validator';
import { PageService } from '../services/page.service';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PageStatus } from '@affexai/shared-types';

// DTO for bulk operations
class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

class BulkStatusDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(PageStatus)
  status: PageStatus;
}

@Controller('cms/pages')
@UseGuards(JwtAuthGuard)
export class PageController {
  constructor(private readonly pageService: PageService) { }

  // ============ BULK OPERATIONS (must be before :id routes) ============

  @Post('bulk/publish')
  async bulkPublish(@Body() dto: BulkActionDto) {
    return this.pageService.bulkPublish(dto.ids);
  }

  @Post('bulk/unpublish')
  async bulkUnpublish(@Body() dto: BulkActionDto) {
    return this.pageService.bulkUnpublish(dto.ids);
  }

  @Post('bulk/archive')
  async bulkArchive(@Body() dto: BulkActionDto) {
    return this.pageService.bulkArchive(dto.ids);
  }

  @Post('bulk/delete')
  async bulkDelete(@Body() dto: BulkActionDto) {
    return this.pageService.bulkDelete(dto.ids);
  }

  @Post('bulk/status')
  async bulkUpdateStatus(@Body() dto: BulkStatusDto) {
    return this.pageService.bulkUpdateStatus(dto.ids, dto.status);
  }

  // ============ STANDARD CRUD OPERATIONS ============

  @Post()
  async create(@Body() createPageDto: CreatePageDto) {
    return this.pageService.create(createPageDto);
  }

  @Get()
  async findAll(@Query('status') status: PageStatus | undefined) {
    return this.pageService.findAll(status);
  }

  @Get('slug/*slug')
  async findBySlug(@Req() req: Request) {
    // Extract slug from URL path after '/cms/pages/slug/' or '/api/cms/pages/slug/'
    // e.g., /api/cms/pages/slug/solutions/building-design/architecture → slug = "solutions/building-design/architecture"
    // e.g., /api/cms/pages/slug/home → slug = "home" (homepage)
    const fullPath = req.path;
    const slug = fullPath.replace(/^\/?(api\/)?cms\/pages\/slug\//, ''); // Remove prefix (with optional /api/)
    // Tenant ID is handled implicitly by the service via TenantService context

    console.log('Finding page by slug:', slug, 'from path:', fullPath);
    return this.pageService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pageService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pageService.update(id, updatePageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.pageService.remove(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.pageService.publish(id);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return this.pageService.unpublish(id);
  }

  @Post(':id/clone')
  async clone(@Param('id') id: string) {
    return this.pageService.clone(id);
  }
}
