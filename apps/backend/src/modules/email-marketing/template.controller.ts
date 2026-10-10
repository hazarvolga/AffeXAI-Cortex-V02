import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TemplateService } from './template.service';
import { UnifiedTemplateService } from './services/unified-template.service';
import { TemplatePreviewService } from './services/template-preview.service';
import { CreateEmailTemplateDto } from './dto/create-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-template.dto';
import { CloneTemplateDto } from './dto/clone-template.dto';
import { EmailTemplate } from './entities/email-template.entity';
import { UnifiedTemplate } from './types/unified-template.types';

@Controller('email-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly unifiedTemplateService: UnifiedTemplateService,
    private readonly previewService: TemplatePreviewService,
  ) { }

  @Post()
  async create(@Body() createTemplateDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    return await this.templateService.create(createTemplateDto);
  }

  @Get()
  async findAll(): Promise<EmailTemplate[]> {
    return await this.templateService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EmailTemplate> {
    return await this.templateService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    return await this.templateService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.templateService.remove(id);
  }

  @Get(':id/preview')
  async previewTemplate(@Param('id') id: string): Promise<string> {
    const template = await this.templateService.findOne(id);
    return await this.previewService.previewTemplate(template);
  }

  @Post(':id/clone')
  async cloneTemplate(
    @Param('id') id: string,
    @Body() cloneDto: CloneTemplateDto,
  ): Promise<EmailTemplate> {
    return await this.templateService.cloneTemplate(id, cloneDto);
  }

  // Unified Template Endpoints (Database-only)

  @Get('unified/list')
  async listUnifiedTemplates(): Promise<UnifiedTemplate[]> {
    return await this.unifiedTemplateService.listAllTemplates();
  }

  @Get('unified/:id')
  async getUnifiedTemplate(@Param('id') id: string): Promise<UnifiedTemplate> {
    return await this.unifiedTemplateService.getTemplate(id);
  }

  @Post('unified/:id/render')
  async renderTemplate(
    @Param('id') id: string,
    @Body('data') data: any,
  ): Promise<any> {
    return await this.unifiedTemplateService.renderTemplate(id, { data });
  }
}
