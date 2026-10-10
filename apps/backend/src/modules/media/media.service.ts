import { Injectable, NotFoundException, Logger, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Media } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { EventBusService } from '../platform-integration/services/event-bus.service';
import { MediaModule, MediaCategory, MediaType } from '@affexai/shared-types';
import { validateMediaMetadata } from './media-upload-policy';
import { TenantService } from '../../core/tenant/tenant.service';

export interface MediaQueryOptions {
  type?: MediaType;
  module?: MediaModule;
  category?: MediaCategory;
  tags?: string[];
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private eventBusService: EventBusService,
    private tenantService: TenantService,
  ) { }

  private getActiveTenantId(tenantId?: string): string {
    const activeTenantId = this.tenantService.getTenantId();
    if (!activeTenantId) throw new UnauthorizedException('Tenant context required');
    if (tenantId && tenantId !== activeTenantId) throw new ForbiddenException('Tenant mismatch');
    return activeTenantId;
  }

  async create(createMediaDto: CreateMediaDto, tenantId?: string): Promise<Media> {
    validateMediaMetadata(createMediaDto);
    return this.persist(createMediaDto, tenantId);
  }

  async createFromUpload(createMediaDto: CreateMediaDto, tenantId: string): Promise<Media> {
    validateMediaMetadata(createMediaDto, true);
    return this.persist(createMediaDto, tenantId);
  }

  private async persist(createMediaDto: CreateMediaDto, tenantId?: string): Promise<Media> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    try {
      const media = this.mediaRepository.create({ ...createMediaDto, tenantId: activeTenantId });
      const savedMedia = await this.mediaRepository.save(media);

      // Publish platform event (non-blocking, optional)
      try {
        await this.eventBusService.publishMediaUploaded(
          savedMedia.id,
          savedMedia.filename,
          savedMedia.size,
          'system', // NOTE: Uses 'system' for system uploads; user context can be added for audit trails
        );
      } catch (eventError) {
        // Log but don't fail the upload if event publishing fails
        this.logger.warn('Failed to publish media upload event', eventError.stack);
      }

      return savedMedia;
    } catch (error) {
      this.logger.error('Error creating media', error.stack);
      throw error;
    }
  }

  async findAll(tenantId?: string): Promise<Media[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    try {
      return await this.mediaRepository.find({
        where: { isActive: true, tenantId: activeTenantId } as any,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Error fetching media', error.stack);
      throw error;
    }
  }

  async findOne(id: string, tenantId?: string): Promise<Media> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    try {
      const media = await this.mediaRepository.findOne({ where: { id, tenantId: activeTenantId } as any });
      if (!media) {
        throw new NotFoundException(`Media with ID ${id} not found`);
      }
      return media;
    } catch (error) {
      this.logger.error(`Error fetching media with ID ${id}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    try {
      const media = await this.findOne(id);
      const writable = ['module', 'category', 'tags', 'altText', 'title', 'description', 'isActive'];
      if (!updateMediaDto || Object.keys(updateMediaDto).some(key => !writable.includes(key))) throw new BadRequestException('Media identity and storage fields cannot be reassigned');
      if (!Object.keys(updateMediaDto).length) return media;
      const result = await this.mediaRepository.update({ id, tenantId: media.tenantId }, { ...updateMediaDto });
      if (result.affected !== 1) throw new NotFoundException('Media not found');
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating media with ID ${id}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const media = await this.findOne(id);
      // Instead of deleting, we mark as inactive
      await this.update(id, { isActive: false });
    } catch (error) {
      this.logger.error(`Error removing media with ID ${id}`, error.stack);
      throw error;
    }
  }

  async findByType(type: string, tenantId?: string): Promise<Media[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    try {
      return await this.mediaRepository.find({
        where: { type: type as any, isActive: true, tenantId: activeTenantId } as any,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching media by type ${type}`, error.stack);
      throw error;
    }
  }

  /**
   * Find media with advanced filtering options
   */
  async findWithFilters(options: MediaQueryOptions): Promise<{ data: Media[]; total: number }> {
    try {
      const { type, module, category, tags, search, isActive = true, page = 1, limit = 50 } = options;
      const activeTenantId = this.getActiveTenantId();

      const queryBuilder = this.mediaRepository.createQueryBuilder('media');

      // Base filters
      queryBuilder.where('media.isActive = :isActive', { isActive });
      queryBuilder.andWhere('media.tenantId = :tenantId', { tenantId: activeTenantId });

      if (type) {
        queryBuilder.andWhere('media.type = :type', { type });
      }

      if (module) {
        queryBuilder.andWhere('media.module = :module', { module });
      }

      if (category) {
        queryBuilder.andWhere('media.category = :category', { category });
      }

      // Search in filename, title, description
      if (search) {
        queryBuilder.andWhere(
          '(media.filename ILIKE :search OR media.title ILIKE :search OR media.description ILIKE :search OR media.originalName ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Tags filter (PostgreSQL array contains)
      if (tags && tags.length > 0) {
        // For simple-array, we need to search in the comma-separated string
        const tagConditions = tags.map((tag, idx) => `media.tags LIKE :tag${idx}`);
        const tagParams = tags.reduce((acc, tag, idx) => ({ ...acc, [`tag${idx}`]: `%${tag}%` }), {});
        queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`, tagParams);
      }

      // Order and pagination
      queryBuilder.orderBy('media.createdAt', 'DESC');
      queryBuilder.skip((page - 1) * limit);
      queryBuilder.take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      return { data, total };
    } catch (error) {
      this.logger.error('Error fetching media with filters', error.stack);
      throw error;
    }
  }

  /**
   * Find media by module
   */
  async findByModule(module: MediaModule, tenantId?: string): Promise<Media[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    try {
      return await this.mediaRepository.find({
        where: { module, isActive: true, tenantId: activeTenantId } as any,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching media by module ${module}`, error.stack);
      throw error;
    }
  }

  /**
   * Find media by category
   */
  async findByCategory(category: MediaCategory, tenantId?: string): Promise<Media[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    try {
      return await this.mediaRepository.find({
        where: { category, isActive: true, tenantId: activeTenantId } as any,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching media by category ${category}`, error.stack);
      throw error;
    }
  }

  /**
   * Get available modules with media count
   */
  async getModulesWithCount(): Promise<{ module: MediaModule; count: number }[]> {
    const activeTenantId = this.getActiveTenantId();
    try {
      const result = await this.mediaRepository
        .createQueryBuilder('media')
        .select('media.module', 'module')
        .addSelect('COUNT(*)', 'count')
        .where('media.isActive = :isActive', { isActive: true })
        .andWhere('media.tenantId = :tenantId', { tenantId: activeTenantId })
        .groupBy('media.module')
        .getRawMany();

      return result.map((r) => ({ module: r.module, count: parseInt(r.count, 10) }));
    } catch (error) {
      this.logger.error('Error fetching modules with count', error.stack);
      throw error;
    }
  }

  /**
   * Get available categories with media count
   */
  async getCategoriesWithCount(): Promise<{ category: MediaCategory; count: number }[]> {
    const activeTenantId = this.getActiveTenantId();
    try {
      const result = await this.mediaRepository
        .createQueryBuilder('media')
        .select('media.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('media.isActive = :isActive', { isActive: true })
        .andWhere('media.tenantId = :tenantId', { tenantId: activeTenantId })
        .groupBy('media.category')
        .getRawMany();

      return result.map((r) => ({ category: r.category, count: parseInt(r.count, 10) }));
    } catch (error) {
      this.logger.error('Error fetching categories with count', error.stack);
      throw error;
    }
  }
}