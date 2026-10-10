import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { ReusableComponent } from '../entities/reusable-component.entity';
import { ComponentUsageHistory } from '../entities/component-usage-history.entity';
import { ComponentFavorite } from '../entities/component-favorite.entity';
import {
  CreateReusableComponentDto,
  UpdateReusableComponentDto,
  ReusableComponentFilterDto,
  DuplicateReusableComponentDto,
  PaginatedReusableComponentsDto,
} from '../dto/reusable-component.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class ReusableComponentsService {
  constructor(
    @InjectRepository(ReusableComponent)
    private readonly componentRepository: Repository<ReusableComponent>,
    @InjectRepository(ComponentUsageHistory)
    private readonly usageHistoryRepository: Repository<ComponentUsageHistory>,
    @InjectRepository(ComponentFavorite)
    private readonly favoriteRepository: Repository<ComponentFavorite>,
    private readonly tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Create a new reusable component
   */
  async create(
    dto: CreateReusableComponentDto,
    authorId: string,
  ): Promise<ReusableComponent> {
    // Generate unique slug from name
    const slug = await this.generateUniqueSlug(dto.name);

    const component = this.componentRepository.create({
      ...dto,
      slug,
      authorId,
      tenantId: this.tenantId,
    });

    return await this.componentRepository.save(component);
  }

  /**
   * Find all reusable components with filters and pagination
   */
  async findAll(
    filters: ReusableComponentFilterDto,
    userId?: string,
  ): Promise<PaginatedReusableComponentsDto> {
    const {
      search,
      componentType,
      blockCategory,
      categoryId,
      tags,
      authorId,
      isPublic,
      isFeatured,
      myComponents,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      limit = 20,
      page = 1,
    } = filters;

    const queryBuilder = this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.author', 'author')
      .leftJoinAndSelect('component.category', 'category')
      .where('component.tenantId = :tenantId', { tenantId: this.tenantId });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(component.name ILIKE :search OR component.description ILIKE :search OR :search = ANY(component.tags))',
        { search: `%${search}%` },
      );
    }

    if (componentType) {
      queryBuilder.andWhere('component.componentType = :componentType', { componentType });
    }

    if (blockCategory) {
      queryBuilder.andWhere('component.blockCategory = :blockCategory', { blockCategory });
    }

    if (categoryId) {
      queryBuilder.andWhere('component.categoryId = :categoryId', { categoryId });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('component.tags && :tags', { tags });
    }

    if (authorId) {
      queryBuilder.andWhere('component.authorId = :authorId', { authorId });
    }

    if (typeof isPublic === 'boolean') {
      queryBuilder.andWhere('component.isPublic = :isPublic', { isPublic });
    }

    if (typeof isFeatured === 'boolean') {
      queryBuilder.andWhere('component.isFeatured = :isFeatured', { isFeatured });
    }

    if (myComponents && userId) {
      queryBuilder.andWhere('component.authorId = :userId', { userId });
    }

    // Apply sorting
    if (sortBy === 'featured') {
      queryBuilder.orderBy('component.isFeatured', sortOrder);
      queryBuilder.addOrderBy('component.usageCount', 'DESC');
    } else if (sortBy === 'usageCount') {
      queryBuilder.orderBy('component.usageCount', sortOrder);
    } else {
      queryBuilder.orderBy(`component.${sortBy}`, sortOrder);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find one reusable component by ID
   */
  async findOne(id: string): Promise<ReusableComponent> {
    const component = await this.componentRepository.findOne({
      where: { id, tenantId: this.tenantId },
      relations: ['author', 'category', 'parentVersion'],
    });

    if (!component) {
      throw new NotFoundException(`Reusable component with ID ${id} not found`);
    }

    return component;
  }

  /**
   * Update a reusable component
   */
  async update(
    id: string,
    dto: UpdateReusableComponentDto,
  ): Promise<ReusableComponent> {
    const component = await this.findOne(id);

    // If name changed, regenerate slug
    if (dto.name && dto.name !== component.name) {
      dto['slug'] = await this.generateUniqueSlug(dto.name, id);
    }

    Object.assign(component, dto);
    component.updatedAt = new Date();

    return await this.componentRepository.save(component);
  }

  /**
   * Delete a reusable component
   */
  async remove(id: string): Promise<void> {
    const component = await this.findOne(id);
    await this.componentRepository.remove(component);
  }

  /**
   * Duplicate a reusable component
   */
  async duplicate(
    id: string,
    dto: DuplicateReusableComponentDto,
    authorId: string,
  ): Promise<ReusableComponent> {
    const original = await this.findOne(id);

    const slug = await this.generateUniqueSlug(dto.name);

    const duplicate = this.componentRepository.create({
      name: dto.name,
      slug,
      description: original.description,
      componentType: original.componentType,
      blockType: original.blockType,
      blockCategory: original.blockCategory,
      props: original.props,
      tags: original.tags,
      categoryId: original.categoryId,
      designTokens: original.designTokens,
      thumbnailUrl: original.thumbnailUrl,
      authorId,
      isPublic: false, // Reset visibility
      isFeatured: false,
      parentVersionId: dto.createNewVersion ? original.id : null,
      version: dto.createNewVersion ? original.version + 1 : 1,
      tenantId: this.tenantId,
    });

    return await this.componentRepository.save(duplicate);
  }

  /**
   * Increment usage count when component is used
   */
  async incrementUsage(id: string): Promise<number> {
    const component = await this.findOne(id);
    component.usageCount += 1;
    await this.componentRepository.save(component);
    return component.usageCount;
  }

  /**
   * Track component usage in a page/section
   */
  async trackUsage(
    componentId: string,
    usedInType: string,
    usedInId: string,
    userId?: string,
  ): Promise<void> {
    // Increment usage count
    await this.incrementUsage(componentId);

    // Record usage history
    const history = this.usageHistoryRepository.create({
      usableType: 'reusable_component',
      usableId: componentId,
      usedInType,
      usedInId,
      userId,
      tenantId: this.tenantId,
    });

    await this.usageHistoryRepository.save(history);
  }

  /**
   * Get usage history for a component
   */
  async getUsageHistory(componentId: string): Promise<ComponentUsageHistory[]> {
    return await this.usageHistoryRepository.find({
      where: {
        usableType: 'reusable_component',
        usableId: componentId,
        tenantId: this.tenantId, // Ensure history is also tenant scoped if needed, or componentId check is enough
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit to last 100 uses
    });
  }

  /**
   * Add component to favorites
   */
  async addToFavorites(componentId: string, userId: string): Promise<void> {
    // Check if component exists
    await this.findOne(componentId);

    // Check if already favorited
    const existing = await this.favoriteRepository.findOne({
      where: {
        userId,
        favoritableType: 'reusable_component',
        favoritableId: componentId,
        tenantId: this.tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException('Component already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      userId,
      favoritableType: 'reusable_component',
      favoritableId: componentId,
      tenantId: this.tenantId,
    });

    await this.favoriteRepository.save(favorite);
  }

  /**
   * Remove component from favorites
   */
  async removeFromFavorites(componentId: string, userId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        userId,
        favoritableType: 'reusable_component',
        favoritableId: componentId,
        tenantId: this.tenantId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * Get user's favorite components
   */
  async getFavorites(userId: string): Promise<ReusableComponent[]> {
    const favorites = await this.favoriteRepository.find({
      where: {
        userId,
        favoritableType: 'reusable_component',
        tenantId: this.tenantId,
      },
    });

    const componentIds = favorites.map((f) => f.favoritableId);

    if (componentIds.length === 0) {
      return [];
    }

    return await this.componentRepository.find({
      where: { id: In(componentIds), tenantId: this.tenantId },
      relations: ['author', 'category'],
    });
  }

  /**
   * Check if component is favorited by user
   */
  async isFavorited(componentId: string, userId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        userId,
        favoritableType: 'reusable_component',
        favoritableId: componentId,
        tenantId: this.tenantId,
      },
    });

    return !!favorite;
  }

  /**
   * Export component as JSON
   */
  async export(id: string): Promise<any> {
    const component = await this.findOne(id);

    return {
      name: component.name,
      description: component.description,
      componentType: component.componentType,
      blockType: component.blockType,
      blockCategory: component.blockCategory,
      props: component.props,
      tags: component.tags,
      designTokens: component.designTokens,
      version: 1, // Export format version
    };
  }

  /**
   * Import components from JSON
   */
  async import(
    components: CreateReusableComponentDto[],
    authorId: string,
    overwrite = false,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const dto of components) {
      try {
        const slug = await this.generateUniqueSlug(dto.name);

        // Check if exists in current tenant
        const existing = await this.componentRepository.findOne({
          where: { slug, tenantId: this.tenantId }
        });

        if (existing && !overwrite) {
          results.failed++;
          results.errors.push(`Component "${dto.name}" already exists`);
          continue;
        }

        if (existing && overwrite) {
          // Update existing
          Object.assign(existing, dto);
          await this.componentRepository.save(existing);
        } else {
          // Create new
          await this.create(dto, authorId);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import "${dto.name}": ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Generate unique slug from name
   */
  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let counter = 1;
    let finalSlug = slug;

    while (true) {
      const where: FindOptionsWhere<ReusableComponent> = {
        slug: finalSlug,
        tenantId: this.tenantId
      };
      if (excludeId) {
        where.id = excludeId as any; // Exclude current component when updating
      }

      const existing = await this.componentRepository.findOne({ where });

      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }
}
