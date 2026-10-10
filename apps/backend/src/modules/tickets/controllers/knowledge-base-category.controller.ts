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
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { KnowledgeBaseCategoryService } from '../services/knowledge-base-category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderTicketCategoriesDto,
  MoveCategoryDto,
  BulkUpdateStatusDto,
  BulkDeleteDto,
} from '../dto/knowledge-base-category.dto';

/**
 * Knowledge Base Category Controller
 * Manages KB article categories
 */
@ApiTags('Knowledge Base Categories')
@ApiBearerAuth()
@Controller('knowledge-base/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnowledgeBaseCategoryController {
  constructor(
    private readonly categoryService: KnowledgeBaseCategoryService,
  ) { }

  /**
   * Create new category
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create new KB category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async createCategory(
    @Body(ValidationPipe) dto: CreateCategoryDto,
    @CurrentUser() user: User,
  ) {
    const category = await this.categoryService.createCategory(dto, user.id);
    return {
      success: true,
      data: category,
    };
  }

  /**
   * Get category tree structure
   */
  @Get('admin/all')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async getAdminCategories() { return this.categoryService.getAdminCategories(); }

  @Get('tree')
  @ApiOperation({ summary: 'Get KB category tree structure' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategoryTree() {
    const tree = await this.categoryService.getCategoryTree();
    return {
      success: true,
      data: tree,
    };
  }

  /**
   * Get category statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get KB category statistics' })
  @ApiResponse({ status: 200, description: 'Category statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin or Editor access required' })
  async getCategoryStats() {
    const stats = await this.categoryService.getCategoryStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Search categories
   */
  @Get('search')
  @ApiOperation({ summary: 'Search KB categories' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchCategories(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: 'Search query must be at least 2 characters long',
        data: [],
      };
    }

    const categories = await this.categoryService.searchCategories(query.trim());
    return {
      success: true,
      data: categories,
    };
  }

  /**
   * Get all categories
   */
  @Get()
  @ApiOperation({ summary: 'Get all KB categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllCategories() {
    const categories = await this.categoryService.getCategoriesWithCounts();
    return {
      success: true,
      data: categories,
    };
  }

  /**
   * Update category
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update KB category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateCategoryDto,
    @CurrentUser() user: User,
  ) {
    const category = await this.categoryService.updateCategory(id, dto, user.id);
    return {
      success: true,
      data: category,
    };
  }

  /**
   * Delete category
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Delete KB category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Category has articles or other dependencies' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoryService.deleteCategory(id);
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  /**
   * Get categories by parent
   */
  @Get('by-parent')
  @ApiOperation({ summary: 'Get root categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getRootCategories() {
    const categories = await this.categoryService.getCategoriesByParent(undefined);
    return {
      success: true,
      data: categories,
    };
  }

  /**
   * Get categories by parent ID
   */
  @Get('by-parent/:parentId')
  @ApiOperation({ summary: 'Get categories by parent ID' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategoriesByParent(@Param('parentId', ParseUUIDPipe) parentId: string) {
    const categories = await this.categoryService.getCategoriesByParent(parentId);
    return {
      success: true,
      data: categories,
    };
  }

  /**
   * Get category with full path
   */
  @Get(':id/path')
  @ApiOperation({ summary: 'Get category with breadcrumb path' })
  @ApiResponse({ status: 200, description: 'Category with path retrieved successfully' })
  async getCategoryWithPath(@Param('id', ParseUUIDPipe) id: string) {
    const categoryWithPath = await this.categoryService.getCategoryWithPath(id);
    return {
      success: true,
      data: categoryWithPath,
    };
  }

  /**
   * Get category descendants
   */
  @Get(':id/descendants')
  @ApiOperation({ summary: 'Get all descendants of a category' })
  @ApiResponse({ status: 200, description: 'Category descendants retrieved successfully' })
  async getCategoryDescendants(@Param('id', ParseUUIDPipe) id: string) {
    const descendants = await this.categoryService.getCategoryDescendants(id);
    return {
      success: true,
      data: descendants,
    };
  }

  /**
   * Get category ancestors
   */
  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Get all ancestors of a category' })
  @ApiResponse({ status: 200, description: 'Category ancestors retrieved successfully' })
  async getCategoryAncestors(@Param('id', ParseUUIDPipe) id: string) {
    const ancestors = await this.categoryService.getCategoryAncestors(id);
    return {
      success: true,
      data: ancestors,
    };
  }

  /**
   * Reorder categories
   */
  @Post('reorder')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Reorder categories within same parent' })
  @ApiResponse({ status: 200, description: 'Categories reordered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category IDs or different parents' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async reorderCategories(@Body(ValidationPipe) dto: ReorderTicketCategoriesDto) {
    await this.categoryService.reorderCategories(dto.categoryIds);
    return {
      success: true,
      message: 'Categories reordered successfully',
    };
  }

  /**
   * Move category to new parent
   */
  @Put(':id/move')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Move category to new parent' })
  @ApiResponse({ status: 200, description: 'Category moved successfully' })
  async moveCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: MoveCategoryDto,
  ) {
    await this.categoryService.moveCategory(id, dto.newParentId);
    return {
      success: true,
      message: 'Category moved successfully',
    };
  }

  /**
   * Bulk update category status
   */
  @Put('bulk/status')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Bulk update category active status' })
  @ApiResponse({ status: 200, description: 'Categories updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid category IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkUpdateStatus(@Body(ValidationPipe) dto: BulkUpdateStatusDto) {
    await this.categoryService.bulkUpdateStatus(dto.categoryIds, dto.isActive);
    return {
      success: true,
      message: `${dto.categoryIds.length} categories updated successfully`,
    };
  }

  /**
   * Bulk delete categories
   */
  @Delete('bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk delete categories' })
  @ApiResponse({ status: 200, description: 'Categories deleted successfully' })
  @ApiResponse({ status: 400, description: 'Categories have articles or dependencies' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async bulkDeleteCategories(@Body(ValidationPipe) dto: BulkDeleteDto) {
    await this.categoryService.bulkDeleteCategories(dto.categoryIds);
    return {
      success: true,
      message: `${dto.categoryIds.length} categories deleted successfully`,
    };
  }

  /**
   * Update article counts
   */
  @Post('update-counts')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update article counts for all categories' })
  @ApiResponse({ status: 200, description: 'Article counts updated successfully' })
  async updateArticleCounts() {
    await this.categoryService.updateArticleCounts();
    return {
      success: true,
      message: 'Article counts updated successfully',
    };
  }

  /**
   * Initialize default categories (for setup)
   */
  @Post('initialize')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Initialize default KB categories' })
  @ApiResponse({ status: 200, description: 'Default categories created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async initializeDefaultCategories(@CurrentUser() user: User) {
    const createdCategories = await this.categoryService.initializeDefaultCategories(user.id);
    return {
      success: true,
      data: createdCategories,
      message: `${createdCategories.length} default categories created`,
    };
  }

  /**
   * Get category by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get KB category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoryService.getCategory(id);
    return {
      success: true,
      data: category,
    };
  }
}