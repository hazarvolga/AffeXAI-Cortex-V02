import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../entities/page.entity';
import { PageStatus } from '@affexai/shared-types';
import { Component } from '../entities/component.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class CmsSettingsService {
  constructor(
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    private tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Get all published pages with their components
   */
  async getPublishedPages(): Promise<Page[]> {
    return this.pageRepository.find({
      where: {
        status: PageStatus.PUBLISHED,
        tenantId: this.tenantId
      },
      relations: ['components'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a published page by slug with its components
   */
  async getPublishedPageBySlug(slug: string): Promise<Page | null> {
    return this.pageRepository.findOne({
      where: {
        slug: slug,
        status: PageStatus.PUBLISHED,
        tenantId: this.tenantId
      },
      relations: ['components'],
    });
  }

  /**
   * Get all components for a published page, organized hierarchically
   */
  async getPageComponents(pageId: string): Promise<Component[]> {
    // First, verify the page belongs to the tenant
    const page = await this.pageRepository.findOne({
      where: { id: pageId, tenantId: this.tenantId }
    });

    if (!page) {
      return [];
    }

    const components = await this.componentRepository.find({
      where: { pageId },
      order: { orderIndex: 'ASC' },
    });

    // Build hierarchical structure
    const componentMap = new Map<string, Component>();
    const rootComponents: Component[] = [];

    // First pass: create map of all components
    components.forEach(component => {
      component.children = [];
      componentMap.set(component.id, component);
    });

    // Second pass: build parent-child relationships
    components.forEach(component => {
      if (component.parentId) {
        const parent = componentMap.get(component.parentId);
        if (parent) {
          parent.children.push(component);
        }
      } else {
        rootComponents.push(component);
      }
    });

    return rootComponents;
  }

  /**
   * Get CMS configuration that can be used in site settings
   */
  async getCmsConfiguration() {
    const pages = await this.getPublishedPages();

    return {
      pages: pages.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
      })),
      lastUpdated: new Date(),
    };
  }
}