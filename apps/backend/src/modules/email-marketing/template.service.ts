import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, TemplateType } from './entities/email-template.entity';
import { CreateEmailTemplateDto } from './dto/create-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-template.dto';
import { CloneTemplateDto } from './dto/clone-template.dto';
import { MjmlRendererService } from './services/mjml-renderer.service';
import { TenantService } from '../../core/tenant/tenant.service';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(EmailTemplate)
    private templatesRepository: Repository<EmailTemplate>,
    private readonly mjmlRendererService: MjmlRendererService,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  async create(createTemplateDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const tenantId = this.getTenantId();
    const template = this.templatesRepository.create({ ...createTemplateDto, tenantId });
    return this.templatesRepository.save(template);
  }

  async findAll(): Promise<EmailTemplate[]> {
    const tenantId = this.getTenantId();
    return this.templatesRepository.find({ where: { tenantId } });
  }

  async findOne(id: string): Promise<EmailTemplate> {
    const tenantId = this.getTenantId();
    const template = await this.templatesRepository.findOne({ where: { id, tenantId } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async findByName(name: string): Promise<EmailTemplate> {
    const tenantId = this.getTenantId();
    const template = await this.templatesRepository.findOne({ where: { name, tenantId } });
    if (!template) {
      throw new NotFoundException(`Template with name ${name} not found`);
    }
    return template;
  }

  async update(id: string, updateTemplateDto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, updateTemplateDto);
    return this.templatesRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templatesRepository.remove(template);
  }


  /**
   * Clone an existing database template
   * Creates a new editable copy with optional name customization
   */
  async cloneTemplate(
    id: string,
    cloneDto: CloneTemplateDto,
  ): Promise<EmailTemplate> {
    const tenantId = this.getTenantId();
    const originalTemplate = await this.findOne(id);

    // Generate new name
    const newName = cloneDto.newName || `${originalTemplate.name} (Copy)`;
    const newDescription = cloneDto.newDescription || originalTemplate.description;
    const makeEditable = cloneDto.makeEditable !== false; // Default true

    // Create cloned template
    const clonedTemplate = this.templatesRepository.create({
      name: newName,
      description: newDescription,
      type: TemplateType.CUSTOM,
      isActive: true,
      isEditable: makeEditable,
      createdFrom: 'cloned',
      version: 1,

      // Copy structure if exists, otherwise create basic structure from HTML content
      structure: originalTemplate.structure || this.htmlToStructure(originalTemplate.content),

      // Copy or generate compiled versions
      compiledHtml: originalTemplate.compiledHtml || originalTemplate.content,
      compiledMjml: originalTemplate.compiledMjml,

      // Copy metadata
      variables: originalTemplate.variables,
      thumbnailUrl: originalTemplate.thumbnailUrl,
      tenantId, // Determine ownership explicitly
    });

    // If original has JSON structure, render it
    if (clonedTemplate.structure && makeEditable) {
      const { mjml, html } = await this.mjmlRendererService.renderEmail(
        clonedTemplate.structure,
      );
      clonedTemplate.compiledMjml = mjml;
      clonedTemplate.compiledHtml = html;
    }

    return this.templatesRepository.save(clonedTemplate);
  }

  /**
   * Convert legacy HTML content to JSON structure
   * Used when cloning old HTML-only templates
   */
  private htmlToStructure(html: string): any {
    return {
      rows: [
        {
          id: this.generateId(),
          type: 'section',
          columns: [
            {
              id: this.generateId(),
              width: '100%',
              blocks: [
                {
                  id: this.generateId(),
                  type: 'html',
                  properties: {
                    html: html,
                  },
                  styles: {},
                },
              ],
            },
          ],
          settings: {},
        },
      ],
      settings: {
        backgroundColor: '#f5f5f5',
        contentWidth: '600px',
        fonts: [],
      },
    };
  }

  /**
   * Render template structure to HTML
   */
  async renderTemplate(id: string): Promise<{ html: string; mjml: string }> {
    const tenantId = this.getTenantId();
    const template = await this.findOne(id);

    if (!template.structure) {
      // Return legacy HTML content
      return {
        html: template.content || template.compiledHtml,
        mjml: null,
      };
    }

    const { mjml, html } = await this.mjmlRendererService.renderEmail(
      template.structure,
    );

    // Update compiled versions
    await this.templatesRepository.update(id, {
      compiledHtml: html,
      compiledMjml: mjml,
    });

    return { html, mjml };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}