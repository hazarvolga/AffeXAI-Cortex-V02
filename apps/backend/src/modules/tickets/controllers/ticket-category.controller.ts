import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { TicketCategoryService } from '../services/ticket-category.service';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from '../dto/ticket-category.dto';

/**
 * Ticket Category Controller
 * Manages ticket categories with full CRUD operations
 */
@ApiTags('Ticket Categories')
@ApiBearerAuth()
@Controller('ticket-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketCategoryController {
    constructor(
        private readonly categoryService: TicketCategoryService,
    ) { }

    /**
     * Create a new ticket category
     */
    @Post()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @ApiOperation({ summary: 'Create new ticket category' })
    @ApiResponse({ status: 201, description: 'Category created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid category data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 409, description: 'Category name already exists' })
    async createCategory(
        @Body(ValidationPipe) dto: CreateTicketCategoryDto,
    ) {
        const category = await this.categoryService.createCategory(dto);
        return {
            success: true,
            data: category,
            message: 'Category created successfully',
        };
    }

    /**
     * Get all ticket categories
     */
    @Get()
    @ApiOperation({ summary: 'Get all ticket categories' })
    @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getAllCategories() {
        const categories = await this.categoryService.findAll();
        return {
            success: true,
            data: categories,
        };
    }

    /**
     * Get category tree (hierarchical structure)
     */
    @Get('tree')
    @ApiOperation({ summary: 'Get category tree structure' })
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
     * Get single category by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get ticket category by ID' })
    @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async getCategory(@Param('id', ParseUUIDPipe) id: string) {
        const category = await this.categoryService.findOne(id);
        return {
            success: true,
            data: category,
        };
    }

    /**
     * Update ticket category
     */
    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @ApiOperation({ summary: 'Update ticket category' })
    @ApiResponse({ status: 200, description: 'Category updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid category data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiResponse({ status: 409, description: 'Category name already exists' })
    async updateCategory(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) dto: UpdateTicketCategoryDto,
    ) {
        const category = await this.categoryService.updateCategory(id, dto);
        return {
            success: true,
            data: category,
            message: 'Category updated successfully',
        };
    }

    /**
     * Delete ticket category
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete ticket category' })
    @ApiResponse({ status: 200, description: 'Category deleted successfully' })
    @ApiResponse({ status: 400, description: 'Category has tickets or subcategories' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
        await this.categoryService.deleteCategory(id);
        return {
            success: true,
            message: 'Category deleted successfully',
        };
    }

    /**
     * Toggle category active status
     */
    @Put(':id/toggle-active')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @ApiOperation({ summary: 'Toggle category active status' })
    @ApiResponse({ status: 200, description: 'Category status toggled successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
        const category = await this.categoryService.toggleActive(id);
        return {
            success: true,
            data: category,
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
        };
    }
}
