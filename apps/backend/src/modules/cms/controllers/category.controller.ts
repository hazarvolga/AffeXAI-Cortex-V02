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
import { CategoryService } from '../services/category.service';
import { CreateCmsCategoryDto } from '../dto/create-category.dto';
import { UpdateCmsCategoryDto } from '../dto/update-category.dto';
import { ReorderCategoriesDto } from '../dto/reorder-categories.dto';

@Controller('cms/categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  async create(@Body() createDto: CreateCmsCategoryDto) {
    return this.categoryService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('parentId') parentId: string | undefined,
    @Query('isActive') isActive: string | undefined,
    @Query('search') search: string | undefined,
  ) {
    const params: any = {};

    if (parentId !== undefined) {
      params.parentId = parentId === 'null' ? null : parentId;
    }

    if (isActive !== undefined) {
      params.isActive = isActive === 'true';
    }

    if (search) {
      params.search = search;
    }

    return this.categoryService.findAll(params);
  }

  @Get('tree')
  async getTree() {
    return this.categoryService.getTree();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCmsCategoryDto,
  ) {
    return this.categoryService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(@Body() dto: ReorderCategoriesDto) {
    await this.categoryService.reorder(dto);
    return { message: 'Categories reordered successfully' };
  }

  @Post('batch-update')
  @HttpCode(HttpStatus.OK)
  async batchUpdate(
    @Body() updates: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ) {
    await this.categoryService.batchUpdateCategories(updates);
    return { message: 'Categories updated successfully' };
  }
}
