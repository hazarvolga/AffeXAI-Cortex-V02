import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Category } from '../entities/category.entity';
import {
  CreateCmsCategoryDto,
  UpdateCmsCategoryDto,
  CmsCategoryTree,
  ReorderCmsCategoriesDto,
} from '@affexai/shared-types';
import { slugify } from '../../../common/utils/slugify.util';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Generate slug from category name
   * Uses centralized slugify utility with Turkish character support
   */
  private generateSlug(name: string): string {
    return slugify(name);
  }

  /**
   * Create a new category
   */
  async create(createDto: CreateCmsCategoryDto): Promise<Category> {
    // Generate slug if not provided
    const slug = createDto.slug || this.generateSlug(createDto.name);

    // Check if slug already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { slug, tenantId: this.tenantId },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    // Validate parent category if provided
    if (createDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createDto.parentId, tenantId: this.tenantId },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${createDto.parentId} not found`);
      }
    }

    const category = this.categoryRepository.create({
      ...createDto,
      slug,
      tenantId: this.tenantId,
    });

    return this.categoryRepository.save(category);
  }

  /**
   * Find all categories (flat list)
   */
  async findAll(params?: {
    parentId?: string | null;
    isActive?: boolean;
    search?: string;
  }): Promise<Category[]> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.tenantId = :tenantId', { tenantId: this.tenantId }) // Enforce tenant filter
      .orderBy('category.orderIndex', 'ASC')
      .addOrderBy('category.name', 'ASC');

    // Filter by parent
    if (params?.parentId !== undefined) {
      if (params.parentId === null) {
        queryBuilder.andWhere('category.parentId IS NULL');
      } else {
        queryBuilder.andWhere('category.parentId = :parentId', {
          parentId: params.parentId,
        });
      }
    }

    // Filter by active status
    if (params?.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', {
        isActive: params.isActive,
      });
    }

    // Search by name or description
    if (params?.search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    return queryBuilder.getMany();
  }

  /**
   * Find one category by ID
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId: this.tenantId },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug, tenantId: this.tenantId },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  /**
   * Build hierarchical tree structure
   */
  async getTree(): Promise<CmsCategoryTree[]> {
    // Get all categories for this tenant
    const categories = await this.categoryRepository.find({
      where: { tenantId: this.tenantId },
      order: {
        orderIndex: 'ASC',
        name: 'ASC',
      },
    });

    // Build a map for quick access
    const categoryMap = new Map<string, Category>();
    categories.forEach((cat) => categoryMap.set(cat.id, cat));

    // Build tree structure
    const buildTree = (
      parentId: string | null,
      level: number = 0,
    ): CmsCategoryTree[] => {
      return categories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description || undefined,
          parentId: cat.parentId,
          orderIndex: cat.orderIndex,
          isActive: cat.isActive,
          pageCount: 0, // Will be populated if needed
          children: buildTree(cat.id, level + 1),
          level,
        }));
    };

    return buildTree(null, 0);
  }

  /**
   * Update a category
   */
  async update(id: string, updateDto: UpdateCmsCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Check slug uniqueness if slug is being updated
    if (updateDto.slug && updateDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: updateDto.slug, tenantId: this.tenantId },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          `Category with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    // Validate parent category change
    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (updateDto.parentId) {
        // Check if parent exists
        const parentCategory = await this.categoryRepository.findOne({
          where: { id: updateDto.parentId, tenantId: this.tenantId },
        });

        if (!parentCategory) {
          throw new NotFoundException(
            `Parent category with ID ${updateDto.parentId} not found`,
          );
        }

        // Check for circular reference
        const wouldCreateCircular = await this.wouldCreateCircularReference(
          id,
          updateDto.parentId,
        );

        if (wouldCreateCircular) {
          throw new BadRequestException(
            'Cannot set parent: would create circular reference',
          );
        }
      }
    }

    // Update category
    await this.categoryRepository.update({ id, tenantId: this.tenantId }, updateDto);

    return this.findOne(id);
  }

  /**
   * Check if setting parentId would create a circular reference
   */
  private async wouldCreateCircularReference(
    categoryId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        return true;
      }

      const category = await this.categoryRepository.findOne({
        where: { id: currentId },
      });

      currentId = category?.parentId || null;
    }

    return false;
  }

  /**
   * Delete a category
   */
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has children
    const childrenCount = await this.categoryRepository.count({
      where: { parentId: id, tenantId: this.tenantId },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with child categories. Delete or move child categories first.',
      );
    }

    // Check if category has associated pages
    // Note: This will be enforced by database ON DELETE SET NULL constraint
    // Pages will have their categoryId set to null

    await this.categoryRepository.delete({ id, tenantId: this.tenantId });
  }

  /**
   * Reorder categories
   */
  async reorder(dto: ReorderCmsCategoriesDto): Promise<void> {
    if (dto.categoryIds.length !== dto.orderIndexes.length) {
      throw new BadRequestException(
        'Category IDs and order indexes arrays must have the same length',
      );
    }

    // Update order indexes in a transaction
    await this.categoryRepository.manager.transaction(async (manager) => {
      for (let i = 0; i < dto.categoryIds.length; i++) {
        // Enforce tenant isolation in the update query
        await manager.update(Category, { id: dto.categoryIds[i], tenantId: this.tenantId }, {
          orderIndex: dto.orderIndexes[i],
        });
      }
    });
  }

  /**
   * Get category with page count
   */
  async getCategoryWithPageCount(id: string): Promise<Category & { pageCount: number }> {
    const category = await this.findOne(id);

    const pageCount = await this.categoryRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('cms_pages', 'page')
      .where('page.category_id = :categoryId', { categoryId: id })
      .andWhere('page.tenantId = :tenantId', { tenantId: this.tenantId }) // Filter pages by tenant too!
      .getRawOne()
      .then((result) => parseInt(result.count, 10));

    return {
      ...category,
      pageCount,
    };
  }

  /**
   * Batch update categories (for drag & drop operations)
   * Similar to menu batch update - professional UX with draft state
   */
  async batchUpdateCategories(
    updates: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ): Promise<void> {
    // Validate all categories exist and belong to tenant
    const categoryIds = updates.map((u) => u.id);
    const existingCategories = await this.categoryRepository.find({
      where: { id: In(categoryIds), tenantId: this.tenantId }
    });

    if (existingCategories.length !== categoryIds.length) {
      throw new BadRequestException('Some categories not found');
    }

    // Perform batch update in transaction
    await this.categoryRepository.manager.transaction(async (manager) => {
      for (const update of updates) {
        await manager.update(Category, update.id, {
          parentId: update.parentId,
          orderIndex: update.orderIndex,
        });
      }
    });
  }
}
