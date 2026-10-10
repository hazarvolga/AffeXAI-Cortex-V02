import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Component } from '../entities/component.entity';
import { CreateComponentDto } from '../dto/create-component.dto';
import { UpdateComponentDto } from '../dto/update-component.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    private tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  async create(createComponentDto: CreateComponentDto): Promise<Component> {
    // Validate page ownership
    if (createComponentDto.pageId) {
      const pageRepo = this.componentRepository.manager.getRepository('Page'); // Dynamic string load to avoid circular dependency if imported
      const page = await pageRepo.findOne({
        where: { id: createComponentDto.pageId, tenantId: this.tenantId }
      });

      if (!page) {
        throw new NotFoundException(`Page with ID ${createComponentDto.pageId} not found`);
      }
    }

    const component = this.componentRepository.create({ ...createComponentDto });
    return this.componentRepository.save(component);
  }

  async findAll(pageId?: string): Promise<Component[]> {
    const queryBuilder = this.componentRepository.createQueryBuilder('component');

    // Joint with Page to filter by Tenant ID to ensure isolation reference
    queryBuilder.leftJoinAndSelect('component.page', 'page');
    queryBuilder.where('page.tenantId = :tenantId', { tenantId: this.tenantId });

    if (pageId) {
      queryBuilder.andWhere('component.pageId = :pageId', { pageId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Component | null> {
    const component = await this.componentRepository.findOne({
      where: { id },
      relations: ['children', 'parent', 'page'],
    });

    if (component && component.page && component.page.tenantId !== this.tenantId) {
      return null; // Enforce tenant isolation
    }

    return component;
  }

  async update(id: string, updateComponentDto: UpdateComponentDto): Promise<Component> {
    // Verify ownership first
    await this.findOne(id); // Check existence and tenant

    // Since findOne already checks tenant, we proceed. 
    // But to be safe against race conditions or direct ID access:
    const component = await this.componentRepository.findOne({ where: { id }, relations: ['page'] });
    if (!component || (component.page && component.page.tenantId !== this.tenantId)) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    await this.componentRepository.update(id, updateComponentDto);
    return this.findOne(id) as Promise<Component>;
  }

  async remove(id: string): Promise<void> {
    const component = await this.findOne(id);
    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }
    await this.componentRepository.delete(id);
  }

  async removeByPageId(pageId: string): Promise<void> {
    // Only delete if page belongs to tenant
    const components = await this.findAll(pageId);
    if (components.length > 0) {
      await this.componentRepository.delete({ pageId });
    }
  }

  async reorderComponents(componentIds: string[], orderIndexes: number[]): Promise<Component[]> {
    const components: Component[] = [];

    for (let i = 0; i < componentIds.length; i++) {
      // Update method already checks tenant
      try {
        const component = await this.update(componentIds[i], { orderIndex: orderIndexes[i] });
        if (component) {
          components.push(component);
        }
      } catch (e) {
        // Ignore if not found/access denied
      }
    }

    return components;
  }
}