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
import { ReusableComponentsService } from '../services/reusable-components.service';
import {
  CreateReusableComponentDto,
  UpdateReusableComponentDto,
  ReusableComponentFilterDto,
  DuplicateReusableComponentDto,
  ImportReusableComponentsDto,
} from '../dto/reusable-component.dto';

@Controller('cms/reusable-components')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReusableComponentsController {
  constructor(
    private readonly reusableComponentsService: ReusableComponentsService,
  ) { }

  /**
   * POST /cms/reusable-components
   * Create a new reusable component
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async create(@Body() dto: CreateReusableComponentDto, @Request() req) {
    return await this.reusableComponentsService.create(dto, req.user.id);
  }

  /**
   * GET /cms/reusable-components
   * Get all reusable components with filters
   */
  @Get()
  async findAll(@Query() filters: ReusableComponentFilterDto, @Request() req) {
    return await this.reusableComponentsService.findAll(filters, req.user.id);
  }

  /**
   * GET /cms/reusable-components/:id
   * Get one reusable component by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reusableComponentsService.findOne(id);
  }

  /**
   * PATCH /cms/reusable-components/:id
   * Update a reusable component
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateReusableComponentDto) {
    return await this.reusableComponentsService.update(id, dto);
  }

  /**
   * DELETE /cms/reusable-components/:id
   * Delete a reusable component
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    await this.reusableComponentsService.remove(id);
    return { message: 'Component deleted successfully' };
  }

  /**
   * POST /cms/reusable-components/:id/duplicate
   * Duplicate a reusable component
   */
  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.MARKETING_MANAGER)
  async duplicate(
    @Param('id') id: string,
    @Body() dto: DuplicateReusableComponentDto,
    @Request() req,
  ) {
    return await this.reusableComponentsService.duplicate(id, dto, req.user.id);
  }

  /**
   * POST /cms/reusable-components/:id/use
   * Track usage of a component
   */
  @Post(':id/use')
  async trackUsage(
    @Param('id') id: string,
    @Body() body: { usedInType: string; usedInId: string },
    @Request() req,
  ) {
    await this.reusableComponentsService.trackUsage(
      id,
      body.usedInType,
      body.usedInId,
      req.user.id,
    );
    return { message: 'Usage tracked successfully' };
  }

  /**
   * GET /cms/reusable-components/:id/usage-history
   * Get usage history for a component
   */
  @Get(':id/usage-history')
  async getUsageHistory(@Param('id') id: string) {
    return await this.reusableComponentsService.getUsageHistory(id);
  }

  /**
   * POST /cms/reusable-components/:id/favorite
   * Add component to favorites
   */
  @Post(':id/favorite')
  async addToFavorites(@Param('id') id: string, @Request() req) {
    await this.reusableComponentsService.addToFavorites(id, req.user.id);
    return { message: 'Added to favorites' };
  }

  /**
   * DELETE /cms/reusable-components/:id/favorite
   * Remove component from favorites
   */
  @Delete(':id/favorite')
  async removeFromFavorites(@Param('id') id: string, @Request() req) {
    await this.reusableComponentsService.removeFromFavorites(id, req.user.id);
    return { message: 'Removed from favorites' };
  }

  /**
   * GET /cms/reusable-components/:id/is-favorited
   * Check if component is favorited by user
   */
  @Get(':id/is-favorited')
  async isFavorited(@Param('id') id: string, @Request() req) {
    const isFavorited = await this.reusableComponentsService.isFavorited(
      id,
      req.user.id,
    );
    return { isFavorited };
  }

  /**
   * GET /cms/reusable-components/favorites/my
   * Get user's favorite components
   */
  @Get('favorites/my')
  async getFavorites(@Request() req) {
    return await this.reusableComponentsService.getFavorites(req.user.id);
  }

  /**
   * GET /cms/reusable-components/:id/export
   * Export component as JSON
   */
  @Get(':id/export')
  async export(@Param('id') id: string) {
    return await this.reusableComponentsService.export(id);
  }

  /**
   * POST /cms/reusable-components/import
   * Import components from JSON
   */
  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async import(@Body() dto: ImportReusableComponentsDto, @Request() req) {
    return await this.reusableComponentsService.import(
      dto.components,
      req.user.id,
      dto.overwriteExisting,
    );
  }
}
