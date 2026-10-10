/**
 * CMS types - Pages and Components
 * Based on backend CMS entities
 */

import { BaseEntity } from './common.types';

/**
 * Page status enum
 */
export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Component type enum
 */
export enum ComponentType {
  TEXT = 'text',
  BUTTON = 'button',
  IMAGE = 'image',
  CONTAINER = 'container',
  CARD = 'card',
  GRID = 'grid',
  BLOCK = 'block',
}

/**
 * Page layout options
 */
export interface LayoutOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  showTitle?: boolean;
}

/**
 * Page entity
 */
export interface Page extends BaseEntity {
  title: string;
  slug: string;
  description: string;
  status: PageStatus;
  publishedAt: Date | null;
  createdBy: string;
  updatedBy: string;
  categoryId?: string | null;
  category?: CmsCategory;
  layoutOptions: LayoutOptions;
  components: Component[];
}

/**
 * Component entity
 */
export interface Component extends BaseEntity {
  pageId: string;
  parentId: string | null;
  type: ComponentType;
  
  // NEW: Prebuild block metadata
  blockType?: string;
  blockCategory?: string;
  blockId?: string;
  reusableComponentId?: string;
  
  props: Record<string, any>;
  orderIndex: number;
  children?: Component[];
}

/**
 * Create page DTO
 */
export interface CreatePageDto {
  title: string;
  slug: string;
  description?: string;
  status?: PageStatus;
  categoryId?: string | null;
  createdBy?: string;
  layoutOptions?: LayoutOptions;
}

/**
 * Update page DTO
 */
export interface UpdatePageDto {
  title?: string;
  slug?: string;
  description?: string;
  status?: PageStatus;
  categoryId?: string | null;
  updatedBy?: string;
  layoutOptions?: LayoutOptions;
}

/**
 * Create component DTO
 */
export interface CreateComponentDto {
  pageId: string;
  parentId?: string | null;
  type: ComponentType;
  
  // NEW: Prebuild block metadata
  blockType?: string;
  blockCategory?: string;
  blockId?: string;
  reusableComponentId?: string;
  
  props: Record<string, any>;
  orderIndex?: number;
}

/**
 * Update component DTO
 */
export interface UpdateComponentDto {
  parentId?: string | null;
  type?: ComponentType;
  
  // NEW: Prebuild block metadata
  blockType?: string;
  blockCategory?: string;
  blockId?: string;
  reusableComponentId?: string;
  
  props?: Record<string, any>;
  orderIndex?: number;
}

/**
 * Reorder components DTO
 */
export interface ReorderComponentsDto {
  componentIds: string[];
  orderIndexes: number[];
}

/**
 * Page query parameters
 */
export interface PageQueryParams {
  status?: PageStatus;
  categoryId?: string | null;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Component query parameters
 */
export interface ComponentQueryParams {
  pageId?: string;
  type?: ComponentType;
  parentId?: string | null;
}

/**
 * CMS Category - for organizing CMS pages
 */
export interface CmsCategory extends BaseEntity {
  slug: string;
  name: string;
  description?: string;
  parentId?: string | null;
  parent?: CmsCategory;
  children?: CmsCategory[];
  orderIndex: number;
  isActive: boolean;
  pageCount?: number; // Number of pages in this category
}

/**
 * CMS Category Tree - hierarchical structure
 */
export interface CmsCategoryTree {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string | null;
  orderIndex: number;
  isActive: boolean;
  pageCount: number;
  children: CmsCategoryTree[];
  level: number; // Depth in the tree (0 for root)
}

/**
 * Create CMS Category DTO
 */
export interface CreateCmsCategoryDto {
  name: string;
  slug?: string; // Auto-generated if not provided
  description?: string;
  parentId?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * Update CMS Category DTO
 */
export interface UpdateCmsCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * Reorder CMS Categories DTO
 */
export interface ReorderCmsCategoriesDto {
  categoryIds: string[];
  orderIndexes: number[];
}

/**
 * CMS Category Query Parameters
 */
export interface CmsCategoryQueryParams {
  parentId?: string | null;
  isActive?: boolean;
  search?: string;
  includePageCount?: boolean;
}

/**
 * Menu Location - where the menu will be displayed
 */
export enum MenuLocation {
  HEADER = 'header',
  FOOTER = 'footer',
  SIDEBAR = 'sidebar',
  MOBILE = 'mobile',
}

/**
 * Menu Item Type
 */
export enum MenuItemType {
  LINK = 'link',
  PAGE = 'page',
  CATEGORY = 'category',
  DROPDOWN = 'dropdown',
  MEGA_MENU = 'mega-menu',
  CUSTOM = 'custom',
}

/**
 * CMS Menu
 */
export interface CmsMenu extends BaseEntity {
  name: string;
  slug: string;
  location: MenuLocation;
  isActive: boolean;
  items?: CmsMenuItem[];
  itemCount?: number;
}

/**
 * CMS Menu Item
 */
export interface CmsMenuItem extends BaseEntity {
  menuId: string;
  parentId?: string | null;
  type: MenuItemType;
  label: string;
  url?: string;
  pageId?: string;
  categoryId?: string;
  target?: '_blank' | '_self';
  icon?: string;
  cssClass?: string;
  orderIndex: number;
  isActive: boolean;
  children?: CmsMenuItem[];
  parent?: CmsMenuItem;
  menu?: CmsMenu;
}

/**
 * Menu Tree - hierarchical structure
 */
export interface CmsMenuTree {
  id: string;
  type: MenuItemType;
  label: string;
  url?: string;
  pageId?: string;
  categoryId?: string;
  target?: '_blank' | '_self';
  icon?: string;
  cssClass?: string;
  orderIndex: number;
  isActive: boolean;
  children: CmsMenuTree[];
  level: number;
}

/**
 * Create CMS Menu DTO
 */
export interface CreateCmsMenuDto {
  name: string;
  slug?: string;
  location: MenuLocation;
  isActive?: boolean;
}

/**
 * Update CMS Menu DTO
 */
export interface UpdateCmsMenuDto {
  name?: string;
  slug?: string;
  location?: MenuLocation;
  isActive?: boolean;
}

/**
 * Create CMS Menu Item DTO
 */
export interface CreateCmsMenuItemDto {
  menuId: string;
  parentId?: string | null;
  type: MenuItemType;
  label: string;
  url?: string;
  pageId?: string;
  categoryId?: string;
  target?: '_blank' | '_self';
  icon?: string;
  cssClass?: string;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * Update CMS Menu Item DTO
 */
export interface UpdateCmsMenuItemDto {
  parentId?: string | null;
  type?: MenuItemType;
  label?: string;
  url?: string;
  pageId?: string;
  categoryId?: string;
  target?: '_blank' | '_self';
  icon?: string;
  cssClass?: string;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * Reorder Menu Items DTO
 */
export interface ReorderMenuItemsDto {
  menuItemIds: string[];
  orderIndexes: number[];
}

/**
 * Menu Query Parameters
 */
export interface CmsMenuQueryParams {
  location?: MenuLocation;
  isActive?: boolean;
  search?: string;
}

/**
 * Menu Item Query Parameters
 */
export interface CmsMenuItemQueryParams {
  menuId?: string;
  parentId?: string | null;
  type?: MenuItemType;
  isActive?: boolean;
}
