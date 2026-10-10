import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ReusableSectionsService } from '../services/reusable-sections.service';
import {
  CreateReusableSectionDto,
  UpdateReusableSectionDto,
  ReusableSectionFilterDto,
  DuplicateReusableSectionDto,
  AddSectionComponentDto,
  UpdateSectionComponentDto,
  ReorderSectionComponentsDto,
  UpdateSectionComponentsDto,
} from '../dto/reusable-section.dto';

@Controller('cms/reusable-sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReusableSectionsController {
  constructor(private readonly reusableSectionsService: ReusableSectionsService) { }

  /**
   * POST /cms/reusable-sections
   * Create a new reusable section
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async create(@Body() dto: CreateReusableSectionDto, @Request() req) {
    return await this.reusableSectionsService.create(dto, req.user.id);
  }

  /**
   * GET /cms/reusable-sections
   * Get all reusable sections with filters
   */
  @Get()
  async findAll(@Query() filters: ReusableSectionFilterDto, @Request() req) {
    return await this.reusableSectionsService.findAll(filters, req.user.id);
  }

  /**
   * GET /cms/reusable-sections/:id
   * Get one reusable section by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reusableSectionsService.findOne(id);
  }

  /**
   * PATCH /cms/reusable-sections/:id
   * Update a reusable section
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateReusableSectionDto) {
    return await this.reusableSectionsService.update(id, dto);
  }

  /**
   * DELETE /cms/reusable-sections/:id
   * Delete a reusable section
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    await this.reusableSectionsService.remove(id);
    return { message: 'Section deleted successfully' };
  }

  /**
   * POST /cms/reusable-sections/:id/duplicate
   * Duplicate a reusable section
   */
  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async duplicate(
    @Param('id') id: string,
    @Body() dto: DuplicateReusableSectionDto,
    @Request() req,
  ) {
    return await this.reusableSectionsService.duplicate(id, dto, req.user.id);
  }

  /**
   * POST /cms/reusable-sections/:id/components
   * Add components to a section
   */
  @Post(':id/components')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async addComponents(
    @Param('id') id: string,
    @Body() dto: AddSectionComponentDto[],
  ) {
    return await this.reusableSectionsService.addComponents(id, dto);
  }

  /**
   * PATCH /cms/reusable-sections/:id/components/:componentId
   * Update a component in a section
   */
  @Patch(':id/components/:componentId')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async updateComponent(
    @Param('id') id: string,
    @Param('componentId') componentId: string,
    @Body() dto: UpdateSectionComponentDto,
  ) {
    return await this.reusableSectionsService.updateComponent(
      id,
      componentId,
      dto,
    );
  }

  /**
   * DELETE /cms/reusable-sections/:id/components/:componentId
   * Remove a component from a section
   */
  @Delete(':id/components/:componentId')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async removeComponent(
    @Param('id') id: string,
    @Param('componentId') componentId: string,
  ) {
    return await this.reusableSectionsService.removeComponent(id, componentId);
  }

  /**
   * PATCH /cms/reusable-sections/:id/reorder
   * Reorder components in a section
   */
  @Patch(':id/reorder')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async reorderComponents(
    @Param('id') id: string,
    @Body() dto: ReorderSectionComponentsDto,
  ) {
    return await this.reusableSectionsService.reorderComponents(id, dto);
  }

  /**
   * POST /cms/reusable-sections/:id/use
   * Track usage of a section
   */
  @Post(':id/use')
  async trackUsage(
    @Param('id') id: string,
    @Body() body: { usedInType: string; usedInId: string },
    @Request() req,
  ) {
    await this.reusableSectionsService.trackUsage(
      id,
      body.usedInType,
      body.usedInId,
      req.user.id,
    );
    return { message: 'Usage tracked successfully' };
  }

  /**
   * GET /cms/reusable-sections/:id/usage-history
   * Get usage history for a section
   */
  @Get(':id/usage-history')
  async getUsageHistory(@Param('id') id: string) {
    return await this.reusableSectionsService.getUsageHistory(id);
  }

  /**
   * POST /cms/reusable-sections/:id/favorite
   * Add section to favorites
   */
  @Post(':id/favorite')
  async addToFavorites(@Param('id') id: string, @Request() req) {
    await this.reusableSectionsService.addToFavorites(id, req.user.id);
    return { message: 'Added to favorites' };
  }

  /**
   * DELETE /cms/reusable-sections/:id/favorite
   * Remove section from favorites
   */
  @Delete(':id/favorite')
  async removeFromFavorites(@Param('id') id: string, @Request() req) {
    await this.reusableSectionsService.removeFromFavorites(id, req.user.id);
    return { message: 'Removed from favorites' };
  }

  /**
   * GET /cms/reusable-sections/:id/is-favorited
   * Check if section is favorited by user
   */
  @Get(':id/is-favorited')
  async isFavorited(@Param('id') id: string, @Request() req) {
    const isFavorited = await this.reusableSectionsService.isFavorited(
      id,
      req.user.id,
    );
    return { isFavorited };
  }

  /**
   * GET /cms/reusable-sections/favorites/my
   * Get user's favorite sections
   */
  @Get('favorites/my')
  async getFavorites(@Request() req) {
    return await this.reusableSectionsService.getFavorites(req.user.id);
  }
}
