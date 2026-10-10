import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageTemplate } from '../entities/page-template.entity';
import { CreateCmsTemplateDto } from '../dto/create-template.dto';
import { UpdateCmsTemplateDto } from '../dto/update-template.dto';
import { ImportTemplateDto, ExportTemplateResponseDto } from '../dto/import-template.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(PageTemplate)
    private readonly templateRepository: Repository<PageTemplate>,
    private tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Create a new template
   */
  async create(createTemplateDto: CreateCmsTemplateDto): Promise<PageTemplate> {
    const template = this.templateRepository.create({ ...createTemplateDto, tenantId: this.tenantId });
    return await this.templateRepository.save(template);
  }

  /**
   * Find all templates with optional filtering
   */
  async findAll(options?: {
    category?: string;
    isFeatured?: boolean;
    isActive?: boolean;
  }): Promise<PageTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .leftJoinAndSelect('template.author', 'author')
      .where('template.tenantId = :tenantId', { tenantId: this.tenantId })
      .orderBy('template.isFeatured', 'DESC')
      .addOrderBy('template.createdAt', 'DESC');

    if (options?.category) {
      query.andWhere('template.category = :category', { category: options.category });
    }

    if (options?.isFeatured !== undefined) {
      query.andWhere('template.isFeatured = :isFeatured', { isFeatured: options.isFeatured });
    }

    if (options?.isActive !== undefined) {
      query.andWhere('template.isActive = :isActive', { isActive: options.isActive });
    }

    return await query.getMany();
  }

  /**
   * Find one template by ID
   */
  async findOne(id: string): Promise<PageTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenantId: this.tenantId },
      relations: ['author'],
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Update a template
   */
  async update(id: string, updateTemplateDto: UpdateCmsTemplateDto): Promise<PageTemplate> {
    const template = await this.findOne(id);

    Object.assign(template, updateTemplateDto);

    return await this.templateRepository.save(template);
  }

  /**
   * Delete a template (soft delete by setting isActive = false)
   */
  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    template.isActive = false;
    await this.templateRepository.save(template);
  }

  /**
   * Hard delete a template
   */
  async hardDelete(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<void> {
    // Verify existence within tenant
    await this.findOne(id);
    await this.templateRepository.increment({ id, tenantId: this.tenantId }, 'usageCount', 1);
  }

  /**
   * Import template from JSON
   */
  async import(importTemplateDto: ImportTemplateDto): Promise<PageTemplate> {
    try {
      const templateData = JSON.parse(importTemplateDto.templateData);

      // Validate required fields
      if (!templateData.name || !templateData.category || !templateData.designSystem || !templateData.blocks) {
        throw new BadRequestException('Invalid template data: missing required fields');
      }

      // Create template from imported data
      const createDto: CreateCmsTemplateDto = {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        designSystem: templateData.designSystem,
        blocks: templateData.blocks,
        layoutOptions: templateData.layoutOptions,
        metadata: templateData.metadata,
        preview: templateData.preview,
        constraints: templateData.constraints,
        isFeatured: templateData.isFeatured || false,
        authorId: importTemplateDto.authorId,
      };

      return await this.create(createDto);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON format');
      }
      throw error;
    }
  }

  /**
   * Export template as JSON
   */
  async export(id: string): Promise<ExportTemplateResponseDto> {
    const template = await this.findOne(id);

    const exportData = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      designSystem: template.designSystem,
      blocks: template.blocks,
      layoutOptions: template.layoutOptions,
      metadata: template.metadata,
      preview: template.preview,
      constraints: template.constraints,
      usageCount: template.usageCount,
      isFeatured: template.isFeatured,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    return {
      id: template.id,
      name: template.name,
      data: exportData,
      exportedAt: new Date(),
    };
  }

  /**
   * Get template statistics
   */
  async getStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    featured: number;
    totalUsage: number;
  }> {
    const templates = await this.findAll({ isActive: true });

    const stats = {
      total: templates.length,
      byCategory: templates.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      featured: templates.filter(t => t.isFeatured).length,
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
    };

    return stats;
  }

  /**
   * Duplicate a template
   */
  async duplicate(id: string, newName?: string): Promise<PageTemplate> {
    const original = await this.findOne(id);

    const createDto: CreateCmsTemplateDto = {
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      designSystem: original.designSystem,
      blocks: original.blocks,
      layoutOptions: original.layoutOptions,
      metadata: original.metadata,
      preview: original.preview,
      constraints: original.constraints,
      isFeatured: false,
      authorId: original.authorId,
    };

    return await this.create(createDto);
  }
}
