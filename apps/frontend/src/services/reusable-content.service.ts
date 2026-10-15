import { httpClient } from "../lib/api/http-client";

// Types
export interface ReusableComponent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  componentType: string;
  blockType?: string;
  blockCategory?: string;
  blockId?: string; // Reference to prebuild block config
  props: Record<string, any>;
  tags: string[];
  categoryId?: string;
  designTokens?: Record<string, any>;
  thumbnailUrl?: string;
  authorId?: string;
  isPublic: boolean;
  isFeatured: boolean;
  usageCount: number;
  version: number;
  parentVersionId?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export interface ReusableSection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sectionType: string;
  tags: string[];
  categoryId?: string;
  designSystem?: Record<string, any>;
  layoutOptions?: Record<string, any>;
  constraints?: Record<string, any>;
  thumbnailUrl?: string;
  previewConfig?: Record<string, any>;
  authorId?: string;
  isPublic: boolean;
  isFeatured: boolean;
  usageCount: number;
  version: number;
  parentVersionId?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
  components?: SectionComponent[];
}

export interface SectionComponent {
  id: string;
  sectionId: string;
  reusableComponentId?: string;
  componentType: string;
  blockType?: string;
  props: Record<string, any>;
  parentId?: string;
  orderIndex: number;
  layoutProps?: Record<string, any>;
  reusableComponent?: ReusableComponent;
  children?: SectionComponent[];
}

export interface ComponentFilters {
  search?: string;
  componentType?: string;
  blockType?: string;
  blockCategory?: string;
  categoryId?: string;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  myComponents?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt" | "usageCount" | "featured";
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  page?: number;
}

export interface SectionFilters {
  search?: string;
  sectionType?: string;
  categoryId?: string;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  mySections?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt" | "usageCount" | "featured";
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateComponentDto {
  name: string;
  description?: string;
  componentType: string;
  blockType?: string;
  blockCategory?: string;
  blockId?: string; // Reference to prebuild block config
  props: Record<string, any>;
  tags?: string[];
  categoryId?: string;
  designTokens?: Record<string, any>;
  thumbnailUrl?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
}

export interface UpdateComponentDto {
  name?: string;
  description?: string;
  componentType?: string;
  blockType?: string;
  blockCategory?: string;
  blockId?: string; // Reference to prebuild block config
  props?: Record<string, any>;
  tags?: string[];
  categoryId?: string;
  designTokens?: Record<string, any>;
  thumbnailUrl?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
}

export interface CreateSectionDto {
  name: string;
  description?: string;
  sectionType: string;
  tags?: string[];
  categoryId?: string;
  designSystem?: Record<string, any>;
  layoutOptions?: Record<string, any>;
  constraints?: Record<string, any>;
  thumbnailUrl?: string;
  previewConfig?: Record<string, any>;
  isPublic?: boolean;
  isFeatured?: boolean;
  components?: Array<{
    reusableComponentId?: string;
    componentType: string;
    blockType?: string;
    props: Record<string, any>;
    parentId?: string;
    orderIndex?: number;
    layoutProps?: Record<string, any>;
  }>;
}

export interface UpdateSectionDto {
  name?: string;
  description?: string;
  sectionType?: string;
  tags?: string[];
  categoryId?: string;
  designSystem?: Record<string, any>;
  layoutOptions?: Record<string, any>;
  constraints?: Record<string, any>;
  thumbnailUrl?: string;
  previewConfig?: Record<string, any>;
  isPublic?: boolean;
  isFeatured?: boolean;
  components?: Array<{
    reusableComponentId?: string;
    componentType: string;
    blockType?: string;
    props: Record<string, any>;
    parentId?: string;
    orderIndex?: number;
    layoutProps?: Record<string, any>;
  }>;
}

// Reusable Components Service
export const ReusableComponentsService = {
  // Get all components with filters
  async getAll(
    filters?: ComponentFilters,
  ): Promise<PaginatedResponse<ReusableComponent>> {
    return httpClient.getWrapped<PaginatedResponse<ReusableComponent>>(
      "/cms/reusable-components",
      { params: filters },
    );
  },

  // Get single component
  async getById(id: string): Promise<ReusableComponent> {
    return httpClient.getWrapped<ReusableComponent>(
      `/cms/reusable-components/${id}`,
    );
  },

  // Create component
  async create(dto: CreateComponentDto): Promise<ReusableComponent> {
    return httpClient.postWrapped<ReusableComponent>(
      "/cms/reusable-components",
      dto,
    );
  },

  // Update component
  async update(
    id: string,
    dto: UpdateComponentDto,
  ): Promise<ReusableComponent> {
    return httpClient.patchWrapped<ReusableComponent>(
      `/cms/reusable-components/${id}`,
      dto,
    );
  },

  // Delete component
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/cms/reusable-components/${id}`);
  },

  // Duplicate component
  async duplicate(
    id: string,
    name: string,
    createNewVersion: boolean = false,
  ): Promise<ReusableComponent> {
    return httpClient.postWrapped<ReusableComponent>(
      `/cms/reusable-components/${id}/duplicate`,
      { name, createNewVersion },
    );
  },

  // Track usage
  async trackUsage(
    id: string,
    usedInType: string,
    usedInId: string,
  ): Promise<void> {
    await httpClient.post(`/cms/reusable-components/${id}/use`, {
      usedInType,
      usedInId,
    });
  },

  // Get usage history
  async getUsageHistory(id: string): Promise<any[]> {
    return httpClient.getWrapped<any[]>(
      `/cms/reusable-components/${id}/usage-history`,
    );
  },

  // Add to favorites
  async addToFavorites(id: string): Promise<void> {
    await httpClient.post(`/cms/reusable-components/${id}/favorite`);
  },

  // Remove from favorites
  async removeFromFavorites(id: string): Promise<void> {
    await httpClient.delete(`/cms/reusable-components/${id}/favorite`);
  },

  // Get favorites
  async getFavorites(): Promise<ReusableComponent[]> {
    return httpClient.getWrapped<ReusableComponent[]>(
      "/cms/reusable-components/favorites/my",
    );
  },

  // Export component
  async export(id: string): Promise<any> {
    return httpClient.getWrapped(`/cms/reusable-components/${id}/export`);
  },

  // Import components
  async import(
    components: any[],
    overwriteExisting: boolean = false,
  ): Promise<any> {
    return httpClient.postWrapped("/cms/reusable-components/import", {
      components,
      overwriteExisting,
    });
  },
};

// Reusable Sections Service
export const ReusableSectionsService = {
  // Get all sections with filters
  async getAll(
    filters?: SectionFilters,
  ): Promise<PaginatedResponse<ReusableSection>> {
    return httpClient.getWrapped<PaginatedResponse<ReusableSection>>(
      "/cms/reusable-sections",
      { params: filters },
    );
  },

  // Get single section
  async getById(id: string): Promise<ReusableSection> {
    return httpClient.getWrapped<ReusableSection>(
      `/cms/reusable-sections/${id}`,
    );
  },

  // Create section
  async create(dto: CreateSectionDto): Promise<ReusableSection> {
    return httpClient.postWrapped<ReusableSection>(
      "/cms/reusable-sections",
      dto,
    );
  },

  // Update section
  async update(id: string, dto: UpdateSectionDto): Promise<ReusableSection> {
    return httpClient.patchWrapped<ReusableSection>(
      `/cms/reusable-sections/${id}`,
      dto,
    );
  },

  // Delete section
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/cms/reusable-sections/${id}`);
  },

  // Duplicate section
  async duplicate(
    id: string,
    name: string,
    createNewVersion: boolean = false,
  ): Promise<ReusableSection> {
    return httpClient.postWrapped<ReusableSection>(
      `/cms/reusable-sections/${id}/duplicate`,
      { name, createNewVersion },
    );
  },

  // Get section components
  async getComponents(id: string): Promise<SectionComponent[]> {
    const section = await httpClient.getWrapped<
      ReusableSection & { components?: SectionComponent[] }
    >(`/cms/reusable-sections/${id}`);
    return section?.components ?? [];
  },

  // Track usage
  async trackUsage(
    id: string,
    usedInType: string,
    usedInId: string,
  ): Promise<void> {
    await httpClient.post(`/cms/reusable-sections/${id}/use`, {
      usedInType,
      usedInId,
    });
  },

  // Get usage history
  async getUsageHistory(id: string): Promise<any[]> {
    return httpClient.getWrapped<any[]>(
      `/cms/reusable-sections/${id}/usage-history`,
    );
  },

  // Add to favorites
  async addToFavorites(id: string): Promise<void> {
    await httpClient.post(`/cms/reusable-sections/${id}/favorite`);
  },

  // Remove from favorites
  async removeFromFavorites(id: string): Promise<void> {
    await httpClient.delete(`/cms/reusable-sections/${id}/favorite`);
  },

  // Get favorites
  async getFavorites(): Promise<ReusableSection[]> {
    return httpClient.getWrapped<ReusableSection[]>(
      "/cms/reusable-sections/favorites/my",
    );
  },
};
