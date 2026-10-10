import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Menu } from '../entities/menu.entity';
import { MenuItem } from '../entities/menu-item.entity';
import {
  CreateCmsMenuDto,
  UpdateCmsMenuDto,
  CreateCmsMenuItemDto,
  UpdateCmsMenuItemDto,
  ReorderMenuItemsDto,
  MenuLocation,
  CmsMenuTree,
} from '@affexai/shared-types';
import { slugify } from '../../../common/utils/slugify.util';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
    private tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Generate slug from menu name
   * Uses centralized slugify utility with Turkish character support
   */
  private generateSlug(name: string): string {
    return slugify(name);
  }

  // ==========================================================================
  // Menu Methods
  // ==========================================================================

  /**
   * Create a new menu
   */
  async createMenu(createDto: CreateCmsMenuDto): Promise<Menu> {
    const slug = createDto.slug || this.generateSlug(createDto.name);

    // Check if slug already exists
    const existingMenu = await this.menuRepository.findOne({
      where: { slug, tenantId: this.tenantId },
    });

    if (existingMenu) {
      throw new ConflictException(`Menu with slug "${slug}" already exists`);
    }

    const menu = this.menuRepository.create({
      ...createDto,
      slug,
      tenantId: this.tenantId,
    });

    return this.menuRepository.save(menu);
  }

  /**
   * Find all menus
   */
  async findAllMenus(params?: {
    location?: MenuLocation;
    isActive?: boolean;
    search?: string;
  }): Promise<Menu[]> {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu');
    queryBuilder.where('menu.tenantId = :tenantId', { tenantId: this.tenantId });

    if (params?.location) {
      queryBuilder.andWhere('menu.location = :location', {
        location: params.location,
      });
    }

    if (params?.isActive !== undefined) {
      queryBuilder.andWhere('menu.isActive = :isActive', {
        isActive: params.isActive,
      });
    }

    if (params?.search) {
      queryBuilder.andWhere('menu.name ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    queryBuilder.orderBy('menu.name', 'ASC');

    const menus = await queryBuilder.getMany();

    if (menus.length === 0) {
      return [];
    }

    // Optimization: Fetch all items for all menus in a single query
    const menuIds = menus.map(menu => menu.id);
    const allItems = await this.menuItemRepository.find({
      where: { menuId: In(menuIds) },
      // relations: ['parent', 'children'], // Not strictly needed if we build tree manually, but kept for consistency if needed
      order: {
        orderIndex: 'ASC',
        label: 'ASC',
      },
    });

    // Group items by menuId
    const itemsByMenuId = new Map<string, MenuItem[]>();
    for (const item of allItems) {
      if (!itemsByMenuId.has(item.menuId)) {
        itemsByMenuId.set(item.menuId, []);
      }
      itemsByMenuId.get(item.menuId)!.push(item);
    }

    // Build nested tree for each menu (unlimited depth)
    const buildNestedTree = (items: any[], parentId: string | null): any[] => {
      return items
        .filter(item => item.parentId === parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(item => ({
          ...item,
          children: buildNestedTree(items, item.id),
        }));
    };

    // Assign items to menus
    for (const menu of menus) {
      const items = itemsByMenuId.get(menu.id) || [];
      menu.items = buildNestedTree(items, null);
    }

    return menus;
  }

  /**
   * Find one menu by ID
   */
  async findOneMenu(id: string): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id, tenantId: this.tenantId },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    // Load all items for this menu (flat)
    const allItems = await this.findMenuItems(id);

    // Build nested tree recursively (unlimited depth)
    const buildNestedTree = (parentId: string | null): any[] => {
      return allItems
        .filter(item => item.parentId === parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(item => ({
          ...item,
          children: buildNestedTree(item.id), // Recursive call for unlimited depth
        }));
    };

    // Set only root items with nested children
    menu.items = buildNestedTree(null);

    return menu;
  }

  /**
   * Find menu by slug
   */
  async findMenuBySlug(slug: string): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { slug, tenantId: this.tenantId },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with slug "${slug}" not found`);
    }

    // Load all items for this menu (flat)
    const allItems = await this.findMenuItems(menu.id);

    // Build nested tree recursively (unlimited depth)
    const buildNestedTree = (parentId: string | null): any[] => {
      return allItems
        .filter(item => item.parentId === parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(item => ({
          ...item,
          children: buildNestedTree(item.id), // Recursive call for unlimited depth
        }));
    };

    // Set only root items with nested children
    menu.items = buildNestedTree(null);

    return menu;
  }

  /**
   * Update a menu
   */
  async updateMenu(id: string, updateDto: UpdateCmsMenuDto): Promise<Menu> {
    const menu = await this.findOneMenu(id);

    // Check slug uniqueness if slug is being updated
    if (updateDto.slug && updateDto.slug !== menu.slug) {
      const existingMenu = await this.menuRepository.findOne({
        where: { slug: updateDto.slug, tenantId: this.tenantId },
      });

      if (existingMenu && existingMenu.id !== id) {
        throw new ConflictException(
          `Menu with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    await this.menuRepository.update({ id, tenantId: this.tenantId }, updateDto);
    return this.findOneMenu(id);
  }

  /**
   * Delete a menu
   */
  async removeMenu(id: string): Promise<void> {
    const menu = await this.findOneMenu(id);
    await this.menuRepository.delete({ id, tenantId: this.tenantId });
  }

  // ==========================================================================
  // Menu Item Methods
  // ==========================================================================

  /**
   * Create a new menu item
   */
  async createMenuItem(createDto: CreateCmsMenuItemDto): Promise<MenuItem> {
    // Validate menu exists
    const menu = await this.findOneMenu(createDto.menuId);

    // Validate parent item if provided
    if (createDto.parentId) {
      const parentItem = await this.menuItemRepository.findOne({
        where: { id: createDto.parentId },
      });

      if (!parentItem) {
        throw new NotFoundException(
          `Parent menu item with ID ${createDto.parentId} not found`,
        );
      }

      if (parentItem.menuId !== createDto.menuId) {
        throw new BadRequestException(
          'Parent menu item must belong to the same menu',
        );
      }
    }

    const menuItem = this.menuItemRepository.create(createDto);
    return this.menuItemRepository.save(menuItem);
  }

  /**
   * Find all menu items for a menu
   */
  async findMenuItems(menuId: string): Promise<MenuItem[]> {
    // Ensure menu belongs to tenant first (security check)
    await this.findOneMenu(menuId);

    return this.menuItemRepository.find({
      where: { menuId },
      relations: ['parent', 'children'],
      order: {
        orderIndex: 'ASC',
        label: 'ASC',
      },
    });
  }

  /**
   * Get menu items as tree structure
   */
  async getMenuItemTree(menuId: string): Promise<CmsMenuTree[]> {
    const menu = await this.findOneMenu(menuId);
    const items = await this.findMenuItems(menuId);

    const buildTree = (
      parentId: string | null,
      level: number = 0,
    ): CmsMenuTree[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
          url: item.url || undefined,
          pageId: item.pageId || undefined,
          categoryId: item.categoryId || undefined,
          target: item.target || undefined,
          icon: item.icon || undefined,
          cssClass: item.cssClass || undefined,
          orderIndex: item.orderIndex,
          isActive: item.isActive,
          children: buildTree(item.id, level + 1),
          level,
        }));
    };

    return buildTree(null, 0);
  }

  /**
   * Find one menu item by ID
   */
  async findOneMenuItem(id: string): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'menu'],
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    // Ensure associated menu belongs to tenant
    if (menuItem.menu.tenantId !== this.tenantId) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return menuItem;
  }

  /**
   * Update a menu item
   */
  async updateMenuItem(
    id: string,
    updateDto: UpdateCmsMenuItemDto,
  ): Promise<MenuItem> {
    const menuItem = await this.findOneMenuItem(id);

    // Validate parent item change
    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === id) {
        throw new BadRequestException('Menu item cannot be its own parent');
      }

      if (updateDto.parentId) {
        const parentItem = await this.menuItemRepository.findOne({
          where: { id: updateDto.parentId },
        });

        if (!parentItem) {
          throw new NotFoundException(
            `Parent menu item with ID ${updateDto.parentId} not found`,
          );
        }

        if (parentItem.menuId !== menuItem.menuId) {
          throw new BadRequestException(
            'Parent menu item must belong to the same menu',
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

    await this.menuItemRepository.update(id, updateDto);
    return this.findOneMenuItem(id);
  }

  /**
   * Check if setting parentId would create a circular reference
   */
  private async wouldCreateCircularReference(
    menuItemId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === menuItemId) {
        return true;
      }

      const item = await this.menuItemRepository.findOne({
        where: { id: currentId },
      });

      currentId = item?.parentId || null;
    }

    return false;
  }

  /**
   * Delete a menu item
   */
  async removeMenuItem(id: string): Promise<void> {
    const menuItem = await this.findOneMenuItem(id); // Enforces tenant check

    // Check if menu item has children
    const childrenCount = await this.menuItemRepository.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete menu item with child items. Delete or move child items first.',
      );
    }

    await this.menuItemRepository.delete(id);
  }

  /**
   * Reorder menu items
   */
  async reorderMenuItems(dto: ReorderMenuItemsDto): Promise<void> {
    if (dto.menuItemIds.length !== dto.orderIndexes.length) {
      throw new BadRequestException(
        'Menu item IDs and order indexes arrays must have the same length',
      );
    }

    // Checking tenant by checking at least one item? Or transactionally?
    // Optimization: Check if all items belong to a menu owned by tenant.
    // Iteration update: Check ownership inside loop or batch.

    await this.menuItemRepository.manager.transaction(async (manager) => {
      for (let i = 0; i < dto.menuItemIds.length; i++) {
        // We really should check ownership.
        // But doing it for each item is expensive. 
        // Assuming secure controller context. 
        // For strictness, let's look up the item.
        const item = await manager.findOne(MenuItem, {
          where: { id: dto.menuItemIds[i] },
          relations: ['menu']
        });

        if (!item || item.menu.tenantId !== this.tenantId) {
          // Skip or throw? Throwing effectively cancels transaction.
          throw new NotFoundException(`Menu item ${dto.menuItemIds[i]} not found`);
        }

        await manager.update(MenuItem, dto.menuItemIds[i], {
          orderIndex: dto.orderIndexes[i],
        });
      }
    });
  }

  /**
   * Batch update menu items (for drag & drop operations)
   */
  async batchUpdateMenuItems(
    menuId: string,
    updates: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ): Promise<void> {
    // Validate all items belong to the menu
    // AND menu belongs to tenant
    await this.findOneMenu(menuId); // Checks tenant ownership

    const menuItems = await this.findMenuItems(menuId);
    const menuItemIds = new Set(menuItems.map((item) => item.id));

    for (const update of updates) {
      if (!menuItemIds.has(update.id)) {
        throw new BadRequestException(
          `Menu item ${update.id} does not belong to menu ${menuId}`,
        );
      }
    }

    // Perform batch update in transaction
    await this.menuItemRepository.manager.transaction(async (manager) => {
      for (const update of updates) {
        await manager.update(MenuItem, update.id, {
          parentId: update.parentId,
          orderIndex: update.orderIndex,
        });
      }
    });
  }
}
