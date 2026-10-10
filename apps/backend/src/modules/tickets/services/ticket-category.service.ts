import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketCategory } from '../entities/ticket-category.entity';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from '../dto/ticket-category.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class TicketCategoryService {
    private readonly logger = new Logger(TicketCategoryService.name);

    constructor(
        @InjectRepository(TicketCategory)
        private readonly categoryRepository: Repository<TicketCategory>,
        private readonly tenantService: TenantService,
    ) { }

    /**
     * Get current tenant ID from TenantService
     * @private
     */
    private getActiveTenantId(): string {
        return this.tenantService.getTenantId();
    }

    /**
     * Create a new ticket category
     */
    async createCategory(dto: CreateTicketCategoryDto): Promise<TicketCategory> {
        const tenantId = this.getActiveTenantId();
        // Validate parent exists if provided within same tenant
        if (dto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: dto.parentId, tenantId },
            });

            if (!parent) {
                throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
            }

            // Check if parent already has a parent (max 2 levels)
            if (parent.parentId) {
                throw new BadRequestException('Cannot create subcategory of a subcategory. Maximum 2 levels allowed.');
            }
        }

        // Check for duplicate name within same parent and tenant
        const existing = await this.categoryRepository.findOne({
            where: {
                name: dto.name,
                parentId: dto.parentId || null,
                tenantId,
            },
        });

        if (existing) {
            throw new ConflictException(`Category with name "${dto.name}" already exists in this level`);
        }

        // Create category
        const category = this.categoryRepository.create({
            ...dto,
            tenantId, // Explicitly set tenantId
            isActive: true,
            icon: dto.icon || 'folder',
            color: dto.color || 'gray',
        });

        const saved = await this.categoryRepository.save(category);
        this.logger.log(`Created category: ${saved.name} (${saved.id})`);

        return saved;
    }

    /**
     * Get all categories
     */
    async findAll(): Promise<TicketCategory[]> {
        const tenantId = this.getActiveTenantId();
        return this.categoryRepository.find({
            where: { tenantId },
            order: {
                parentId: 'ASC',
                name: 'ASC',
            },
        });
    }

    /**
     * Get category tree (hierarchical structure)
     */
    async getCategoryTree(): Promise<TicketCategory[]> {
        const allCategories = await this.findAll();

        // Get parent categories
        const parents = allCategories.filter(c => !c.parentId);

        // Attach children to parents
        const tree = parents.map(parent => ({
            ...parent,
            children: allCategories.filter(c => c.parentId === parent.id),
        }));

        return tree as any;
    }

    /**
     * Get single category by ID
     */
    async findOne(id: string): Promise<TicketCategory> {
        const tenantId = this.getActiveTenantId();
        const category = await this.categoryRepository.findOne({
            where: { id, tenantId },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    /**
     * Update category
     */
    async updateCategory(id: string, dto: UpdateTicketCategoryDto): Promise<TicketCategory> {
        const activeTenantId = this.getActiveTenantId();
        const category = await this.findOne(id);

        // Validate parent if being changed
        if (dto.parentId !== undefined) {
            // Prevent self-parenting
            if (dto.parentId === id) {
                throw new BadRequestException('Category cannot be its own parent');
            }

            // Validate parent exists
            if (dto.parentId) {
                const parent = await this.categoryRepository.findOne({
                    where: { id: dto.parentId },
                });

                if (!parent) {
                    throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
                }

                // Check if parent already has a parent
                if (parent.parentId) {
                    throw new BadRequestException('Cannot create subcategory of a subcategory. Maximum 2 levels allowed.');
                }

                // Check if this category has children (cannot make it a child if it has children)
                const hasChildren = await this.categoryRepository.count({
                    where: { parentId: id, tenantId: activeTenantId },
                });

                if (hasChildren > 0) {
                    throw new BadRequestException('Cannot make this category a subcategory because it has subcategories');
                }
            }
        }

        // Check for duplicate name if name is being changed
        if (dto.name && dto.name !== category.name) {
            const existing = await this.categoryRepository.findOne({
                where: {
                    name: dto.name,
                    parentId: dto.parentId !== undefined ? dto.parentId : category.parentId,
                    tenantId: activeTenantId,
                },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException(`Category with name "${dto.name}" already exists in this level`);
            }
        }

        // Update category
        Object.assign(category, dto);
        const updated = await this.categoryRepository.save(category);

        this.logger.log(`Updated category: ${updated.name} (${updated.id})`);
        return updated;
    }

    /**
     * Delete category
     */
    async deleteCategory(id: string): Promise<void> {
        const activeTenantId = this.getActiveTenantId();
        const category = await this.findOne(id);

        // Check if category has tickets
        // Note: This requires Ticket entity relation - we'll add a simple check
        const hasTickets = await this.categoryRepository
            .createQueryBuilder('category')
            .leftJoin('tickets', 'ticket', 'ticket.categoryId = category.id AND ticket.tenantId = :tenantId', { tenantId: activeTenantId })
            .where('category.id = :id', { id })
            .andWhere('category.tenantId = :tenantId', { tenantId: activeTenantId })
            .andWhere('ticket.id IS NOT NULL')
            .getCount();

        if (hasTickets > 0) {
            throw new BadRequestException('Cannot delete category with existing tickets. Please reassign tickets first.');
        }

        // Check if category has children
        const hasChildren = await this.categoryRepository.count({
            where: { parentId: id, tenantId: activeTenantId },
        });

        if (hasChildren > 0) {
            throw new BadRequestException('Cannot delete category with subcategories. Please delete subcategories first.');
        }

        await this.categoryRepository.remove(category);
        this.logger.log(`Deleted category: ${category.name} (${id})`);
    }

    /**
     * Toggle category active status
     */
    async toggleActive(id: string): Promise<TicketCategory> {
        const category = await this.findOne(id);
        category.isActive = !category.isActive;

        const updated = await this.categoryRepository.save(category);
        this.logger.log(`Toggled category active status: ${updated.name} (${updated.id}) - ${updated.isActive}`);

        return updated;
    }
}
