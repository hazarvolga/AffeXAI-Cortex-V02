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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { TemplateService } from '../services/template.service';
import { CreateCmsTemplateDto } from '../dto/create-template.dto';
import { UpdateCmsTemplateDto } from '../dto/update-template.dto';
import { ImportTemplateDto } from '../dto/import-template.dto';
import { PageTemplate } from '../entities/page-template.entity';

@ApiTags('CMS Templates')
@Controller('cms/templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) { }

  /**
   * Create a new template
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new page template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createTemplateDto: CreateCmsTemplateDto): Promise<PageTemplate> {
    return await this.templateService.create(createTemplateDto);
  }

  /**
   * Get all templates
   */
  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Filter featured templates' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter active templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findAll(
    @Query('category') category: string | undefined,
    @Query('isFeatured') isFeatured: string | undefined,
    @Query('isActive') isActive: string | undefined,
  ): Promise<PageTemplate[]> {
    const options: any = {};

    if (category) options.category = category;
    if (isFeatured !== undefined) options.isFeatured = isFeatured === 'true';
    if (isActive !== undefined) options.isActive = isActive === 'true';

    return await this.templateService.findAll(options);
  }

  /**
   * Get template statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<any> {
    return await this.templateService.getStats();
  }

  /**
   * Get a single template
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id') id: string): Promise<PageTemplate> {
    return await this.templateService.findOne(id);
  }

  /**
   * Update a template
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateCmsTemplateDto,
  ): Promise<PageTemplate> {
    return await this.templateService.update(id, updateTemplateDto);
  }

  /**
   * Delete a template (soft delete)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template (soft delete)' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.templateService.remove(id);
  }

  /**
   * Increment template usage count
   */
  @Post(':id/use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment template usage count' })
  @ApiResponse({ status: 200, description: 'Usage count incremented' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async incrementUsage(@Param('id') id: string): Promise<{ message: string }> {
    await this.templateService.incrementUsage(id);
    return { message: 'Usage count incremented' };
  }

  /**
   * Import template from JSON
   */
  @Post('import')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import a template from JSON' })
  @ApiResponse({ status: 201, description: 'Template imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid template data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async import(@Body() importTemplateDto: ImportTemplateDto): Promise<PageTemplate> {
    return await this.templateService.import(importTemplateDto);
  }

  /**
   * Export template as JSON
   */
  @Get(':id/export')
  @ApiOperation({ summary: 'Export a template as JSON' })
  @ApiResponse({ status: 200, description: 'Template exported successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async export(@Param('id') id: string): Promise<any> {
    return await this.templateService.export(id);
  }

  /**
   * Duplicate a template
   */
  @Post(':id/duplicate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate a template' })
  @ApiResponse({ status: 201, description: 'Template duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async duplicate(
    @Param('id') id: string,
    @Body('name') newName: string | undefined,
  ): Promise<PageTemplate> {
    return await this.templateService.duplicate(id, newName);
  }
}
