import { httpClient } from './http-client';

export interface TicketCategory {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    children?: TicketCategory[];
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
}

/**
 * Ticket Category API Service
 */
export const ticketCategoryService = {
    /**
     * Get all categories
     */
    async getAll(): Promise<TicketCategory[]> {
        return await httpClient.getWrapped<TicketCategory[]>('/ticket-categories');
    },

    /**
     * Get category tree (hierarchical structure)
     */
    async getTree(): Promise<TicketCategory[]> {
        return await httpClient.getWrapped<TicketCategory[]>('/ticket-categories/tree');
    },

    /**
     * Get single category by ID
     */
    async getById(id: string): Promise<TicketCategory> {
        return await httpClient.getWrapped<TicketCategory>(`/ticket-categories/${id}`);
    },

    /**
     * Create new category
     */
    async create(data: CreateCategoryDto): Promise<TicketCategory> {
        return await httpClient.postWrapped<TicketCategory>('/ticket-categories', data);
    },

    /**
     * Update category
     */
    async update(id: string, data: UpdateCategoryDto): Promise<TicketCategory> {
        return await httpClient.putWrapped<TicketCategory>(`/ticket-categories/${id}`, data);
    },

    /**
     * Delete category
     */
    async delete(id: string): Promise<void> {
        await httpClient.delete(`/ticket-categories/${id}`);
    },

    /**
     * Toggle category active status
     */
    async toggleActive(id: string): Promise<TicketCategory> {
        return await httpClient.putWrapped<TicketCategory>(`/ticket-categories/${id}/toggle-active`);
    },
};
