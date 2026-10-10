import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In, DataSource } from 'typeorm';
import { ReusableSection } from '../entities/reusable-section.entity';
import { SectionComponent } from '../entities/section-component.entity';
import { ComponentUsageHistory } from '../entities/component-usage-history.entity';
import { ComponentFavorite } from '../entities/component-favorite.entity';
import { ReusableComponentsService } from './reusable-components.service';
import {
  CreateReusableSectionDto,
  UpdateReusableSectionDto,
  ReusableSectionFilterDto,
  DuplicateReusableSectionDto,
  AddSectionComponentDto,
  UpdateSectionComponentDto,
  ReorderSectionComponentsDto,
  UpdateSectionComponentsDto,
  PaginatedReusableSectionsDto
} from '../dto/reusable-section.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class ReusableSectionsService {
  constructor(
    @InjectRepository(ReusableSection)
    private readonly sectionRepository: Repository<ReusableSection>,
    @InjectRepository(SectionComponent)
    private readonly sectionComponentRepository: Repository<SectionComponent>,
    @InjectRepository(ComponentUsageHistory)
    private readonly usageHistoryRepository: Repository<ComponentUsageHistory>,
    @InjectRepository(ComponentFavorite)
    private readonly favoriteRepository: Repository<ComponentFavorite>,
    private readonly reusableComponentsService: ReusableComponentsService,
    private readonly dataSource: DataSource,
    private readonly tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Create a new reusable section
   */
  async create(
    dto: CreateReusableSectionDto,
    authorId: string,
  ): Promise<ReusableSection> {
    // Generate unique slug from name
    const slug = await this.generateUniqueSlug(dto.name);

    const { components, ...sectionData } = dto;

    const section = this.sectionRepository.create({
      ...sectionData,
      slug,
      authorId,
      tenantId: this.tenantId,
    });

    const savedSection = await this.sectionRepository.save(section);

    // Add components if provided
    if (components && components.length > 0) {
      await this.addComponents(savedSection.id, components);
    }

    return await this.findOne(savedSection.id);
  }

  /**
   * Find all reusable sections with filters and pagination
   */
  async findAll(
    filters: ReusableSectionFilterDto,
    userId?: string,
  ): Promise<PaginatedReusableSectionsDto> {
    try {
      const {
        search,
        sectionType,
        categoryId,
        tags,
        authorId,
        isPublic,
        isFeatured,
        mySections,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        limit = 20,
        page = 1,
      } = filters;

      const queryBuilder = this.sectionRepository
        .createQueryBuilder('section')
        .leftJoinAndSelect('section.author', 'author')
        .leftJoinAndSelect('section.category', 'category')
        .where('section.tenantId = :tenantId', { tenantId: this.tenantId });

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(section.name ILIKE :search OR section.description ILIKE :search OR :search = ANY(section.tags))',
          { search: `%${search}%` },
        );
      }

      if (sectionType) {
        queryBuilder.andWhere('section.sectionType = :sectionType', { sectionType });
      }

      if (categoryId) {
        queryBuilder.andWhere('section.categoryId = :categoryId', { categoryId });
      }

      if (tags && tags.length > 0) {
        queryBuilder.andWhere('section.tags && :tags', { tags });
      }

      if (authorId) {
        queryBuilder.andWhere('section.authorId = :authorId', { authorId });
      }

      if (typeof isPublic === 'boolean') {
        queryBuilder.andWhere('section.isPublic = :isPublic', { isPublic });
      }

      if (typeof isFeatured === 'boolean') {
        queryBuilder.andWhere('section.isFeatured = :isFeatured', { isFeatured });
      }

      if (mySections && userId) {
        queryBuilder.andWhere('section.authorId = :userId', { userId });
      }

      // Apply sorting
      if (sortBy === 'featured') {
        queryBuilder.orderBy('section.isFeatured', sortOrder);
        queryBuilder.addOrderBy('section.usageCount', 'DESC');
      } else if (sortBy === 'usageCount') {
        queryBuilder.orderBy('section.usageCount', sortOrder);
      } else {
        queryBuilder.orderBy(`section.${sortBy}`, sortOrder);
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
    } catch (error) {
      console.error('ReusableSectionsService.findAll error:', error.message);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  }

  /**
   * Find one reusable section by ID
   */
  async findOne(id: string): Promise<ReusableSection> {
    const section = await this.sectionRepository.findOne({
      where: { id, tenantId: this.tenantId },
      relations: [
        'author',
        'category',
        'parentVersion',
        'components',
        'components.reusableComponent',
        'components.children',
      ],
      order: {
        components: {
          orderIndex: 'ASC',
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Reusable section with ID ${id} not found`);
    }

    return section;
  }

  /**
   * Update a reusable section
   */
  async update(
    id: string,
    dto: UpdateReusableSectionDto,
  ): Promise<ReusableSection> {
    const section = await this.findOne(id);

    // If name changed, regenerate slug
    if (dto.name && dto.name !== section.name) {
      dto['slug'] = await this.generateUniqueSlug(dto.name, id);
    }

    const { components, ...sectionData } = dto;

    Object.assign(section, sectionData);
    section.updatedAt = new Date();

    await this.sectionRepository.save(section);

    // Update components if provided
    if (components !== undefined) {
      // Remove existing components
      await this.sectionComponentRepository.delete({ sectionId: id, tenantId: this.tenantId });

      // Add new components
      if (components.length > 0) {
        await this.addComponents(id, components);
      }
    }

    return await this.findOne(id);
  }

  /**
   * Delete a reusable section
   */
  async remove(id: string): Promise<void> {
    const section = await this.findOne(id);
    await this.sectionRepository.remove(section);
  }

  /**
   * Duplicate a reusable section
   */
  async duplicate(
    id: string,
    dto: DuplicateReusableSectionDto,
    authorId: string,
  ): Promise<ReusableSection> {
    const original = await this.findOne(id);
    const slug = await this.generateUniqueSlug(dto.name);

    // Start transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create duplicate section
      const duplicate = this.sectionRepository.create({
        name: dto.name,
        slug,
        description: original.description,
        sectionType: original.sectionType,
        tags: original.tags,
        categoryId: original.categoryId,
        designSystem: original.designSystem,
        layoutOptions: original.layoutOptions,
        constraints: original.constraints,
        thumbnailUrl: original.thumbnailUrl,
        previewConfig: original.previewConfig,
        authorId,
        isPublic: false,
        isFeatured: false,
        parentVersionId: dto.createNewVersion ? original.id : null,
        version: dto.createNewVersion ? original.version + 1 : 1,
        tenantId: this.tenantId,
      });

      const savedDuplicate = await queryRunner.manager.save(duplicate);

      // 2. Duplicate components
      if (original.components && original.components.length > 0) {
        const componentsToCreate = original.components.map((comp) => {
          return this.sectionComponentRepository.create({
            sectionId: savedDuplicate.id,
            reusableComponentId: comp.reusableComponentId,
            componentType: comp.componentType,
            blockType: comp.blockType,
            props: comp.props,
            layoutProps: comp.layoutProps,
            parentId: null, // Reset hierarchy for now
            orderIndex: comp.orderIndex,
            tenantId: this.tenantId,
          });
        });

        await queryRunner.manager.save(componentsToCreate);
      }

      await queryRunner.commitTransaction();
      return await this.findOne(savedDuplicate.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add components to a section
   */
  async addComponents(
    sectionId: string,
    dtos: AddSectionComponentDto[],
  ): Promise<ReusableSection> {
    const section = await this.findOne(sectionId);

    // Get current max order index
    const lastComponent = await this.sectionComponentRepository.findOne({
      where: { sectionId, tenantId: this.tenantId },
      order: { orderIndex: 'DESC' },
    });

    let startOrder = lastComponent ? lastComponent.orderIndex + 1 : 0;

    const componentsToCreate = [];

    for (const dto of dtos) {
      if (dto.reusableComponentId) {
        await this.reusableComponentsService.findOne(dto.reusableComponentId);
        await this.reusableComponentsService.trackUsage(
          dto.reusableComponentId,
          'reusable_section',
          sectionId,
        );
      }

      const component = this.sectionComponentRepository.create({
        sectionId,
        reusableComponentId: dto.reusableComponentId,
        componentType: dto.componentType,
        blockType: dto.blockType,
        props: dto.props,
        layoutProps: dto.layoutProps,
        parentId: dto.parentId,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : startOrder++,
        tenantId: this.tenantId,
      });

      componentsToCreate.push(component);
    }

    await this.sectionComponentRepository.save(componentsToCreate);

    return await this.findOne(sectionId);
  }

  /**
   * Update section components (bulk replace)
   */
  async updateComponents(
    sectionId: string,
    dto: UpdateSectionComponentsDto,
  ): Promise<void> {
    await this.findOne(sectionId);
    await this.sectionComponentRepository.delete({ sectionId, tenantId: this.tenantId });
    await this.addComponents(sectionId, dto.components);
  }

  /**
   * Update a component within a section
   */
  async updateComponent(
    sectionId: string,
    componentId: string,
    dto: UpdateSectionComponentDto,
  ): Promise<ReusableSection> {
    const section = await this.findOne(sectionId);

    const component = await this.sectionComponentRepository.findOne({
      where: { id: componentId, sectionId, tenantId: this.tenantId },
    });

    if (!component) {
      throw new NotFoundException(`Component ${componentId} not found in section ${sectionId}`);
    }

    if (dto.reusableComponentId && dto.reusableComponentId !== component.reusableComponentId) {
      await this.reusableComponentsService.findOne(dto.reusableComponentId);
      await this.reusableComponentsService.trackUsage(
        dto.reusableComponentId,
        'reusable_section',
        sectionId,
      );
    }

    Object.assign(component, dto);
    await this.sectionComponentRepository.save(component);

    return await this.findOne(sectionId);
  }

  /**
   * Remove a component from a section
   */
  async removeComponent(sectionId: string, componentId: string): Promise<ReusableSection> {
    const section = await this.findOne(sectionId);

    const component = await this.sectionComponentRepository.findOne({
      where: { id: componentId, sectionId, tenantId: this.tenantId },
    });

    if (!component) {
      throw new NotFoundException(`Component ${componentId} not found in section ${sectionId}`);
    }

    await this.sectionComponentRepository.remove(component);

    return await this.findOne(sectionId);
  }

  /**
   * Reorder components in a section
   */
  async reorderComponents(
    sectionId: string,
    dto: ReorderSectionComponentsDto,
  ): Promise<ReusableSection> {
    const section = await this.findOne(sectionId);

    for (const item of dto.orderedIds) {
      await this.sectionComponentRepository.update(
        { id: item.id, sectionId, tenantId: this.tenantId },
        { orderIndex: item.orderIndex }
      );
    }

    return await this.findOne(sectionId);
  }

  /**
   * Get section components
   */
  async getComponents(sectionId: string): Promise<SectionComponent[]> {
    return await this.sectionComponentRepository.find({
      where: { sectionId, tenantId: this.tenantId },
      relations: ['reusableComponent', 'children'],
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * Increment usage count when section is used
   */
  async incrementUsage(id: string): Promise<number> {
    const section = await this.findOne(id);
    section.usageCount += 1;
    await this.sectionRepository.save(section);
    return section.usageCount;
  }

  /**
   * Track section usage in a page/template
   */
  async trackUsage(
    sectionId: string,
    usedInType: string,
    usedInId: string,
    userId?: string,
  ): Promise<void> {
    await this.incrementUsage(sectionId);

    const history = this.usageHistoryRepository.create({
      usableType: 'reusable_section',
      usableId: sectionId,
      usedInType,
      usedInId,
      userId,
      tenantId: this.tenantId,
    });

    await this.usageHistoryRepository.save(history);

    const components = await this.getComponents(sectionId);
    for (const comp of components) {
      if (comp.reusableComponentId) {
        await this.reusableComponentsService.trackUsage(
          comp.reusableComponentId,
          usedInType,
          usedInId,
          userId,
        );
      }
    }
  }

  /**
   * Get usage history for a section
   */
  async getUsageHistory(sectionId: string): Promise<ComponentUsageHistory[]> {
    return await this.usageHistoryRepository.find({
      where: {
        usableType: 'reusable_section',
        usableId: sectionId,
        tenantId: this.tenantId,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Add to favorites
   */
  async addToFavorites(sectionId: string, userId: string): Promise<void> {
    await this.findOne(sectionId);

    const existing = await this.favoriteRepository.findOne({
      where: {
        userId,
        favoritableType: 'reusable_section',
        favoritableId: sectionId,
        tenantId: this.tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException('Section already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      userId,
      favoritableType: 'reusable_section',
      favoritableId: sectionId,
      tenantId: this.tenantId,
    });

    await this.favoriteRepository.save(favorite);
  }

  /**
   * Remove from favorites
   */
  async removeFromFavorites(sectionId: string, userId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        userId,
        favoritableType: 'reusable_section',
        favoritableId: sectionId,
        tenantId: this.tenantId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * Get user's favorites
   */
  async getFavorites(userId: string): Promise<ReusableSection[]> {
    const favorites = await this.favoriteRepository.find({
      where: {
        userId,
        favoritableType: 'reusable_section',
        tenantId: this.tenantId,
      },
    });

    const sectionIds = favorites.map((f) => f.favoritableId);

    if (sectionIds.length === 0) {
      return [];
    }

    return await this.sectionRepository.find({
      where: { id: In(sectionIds), tenantId: this.tenantId },
      relations: ['author', 'category', 'components'],
    });
  }

  /**
   * Check if favorited
   */
  async isFavorited(sectionId: string, userId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        userId,
        favoritableType: 'reusable_section',
        favoritableId: sectionId,
        tenantId: this.tenantId,
      },
    });

    return !!favorite;
  }

  /**
   * Generate unique slug
   */
  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let counter = 1;
    let finalSlug = slug;

    while (true) {
      const where: FindOptionsWhere<ReusableSection> = {
        slug: finalSlug,
        tenantId: this.tenantId
      };
      if (excludeId) {
        where.id = excludeId as any;
      }

      const existing = await this.sectionRepository.findOne({ where });

      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }
}
