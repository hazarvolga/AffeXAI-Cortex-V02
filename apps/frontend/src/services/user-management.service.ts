import { httpClient } from '@/lib/api/http-client';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string; // Mapped from 'avatar'
    role: string;
    status: 'active' | 'invited' | 'disabled';
    isActive: boolean; // Backend field
    lastActive?: Date; // Mapped from lastLoginAt
    joinedAt: Date;
    primaryRole?: Role; // Backend computed
    roleEntity?: Role; // Backend legacy
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    bio?: string;
}

export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
}

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string; // Optional if using invite flow
    roleId?: string; // Maps to primaryRoleId
    roleIds?: string[]; // Maps to additionalRoleIds
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    bio?: string;
    isActive?: boolean;
}

export interface CreateRoleDto {
    name: string;
    description: string;
    permissions: string[];
    displayName?: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isSystem: boolean;
    userCount: number;
    createdAt: Date;
}

export class UserManagementService {
    private static readonly BASE_URL = '/users';
    private static readonly ROLES_URL = '/roles';

    // --- Users ---
    static async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<{
        items: User[];
        total: number;
    }> {
        const response = await httpClient.get<any>(`${this.BASE_URL}`, { params });
        const data = response.data || response;

        // Handle both array/paginated responses
        const rawItems = Array.isArray(data) ? data : (data.items || data.data || []);
        const total = data.meta?.total || data.total || rawItems.length;

        return {
            items: rawItems.map((u: any) => ({
                ...u,
                avatarUrl: u.avatar,
                status: !u.isActive ? 'disabled' : u.emailVerified ? 'active' : 'invited',
                lastActive: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
                joinedAt: new Date(u.createdAt)
            })),
            total
        };
    }

    static async getStats(): Promise<UserStats> {
        return httpClient.getWrapped<UserStats>(`${this.BASE_URL}/stats`);
    }

    static async createUser(data: CreateUserDto): Promise<User> {
        // Map frontend DTO to backend expected DTO
        const payload = {
            ...data,
            primaryRoleId: data.roleId,
            additionalRoleIds: data.roleIds,
            // Remove frontend-specific fields that might cause issues if backend is strict (though typically ignored)
            roleId: undefined,
            roleIds: undefined
        };
        const response = await httpClient.post<any>(`${this.BASE_URL}`, payload);
        return response.data || response;
    }

    static async inviteUser(data: Pick<CreateUserDto, 'email' | 'firstName' | 'lastName' | 'phone' | 'city' | 'country' | 'bio' | 'roleId'>): Promise<void> {
        await httpClient.post(`${this.BASE_URL}/invitations`, {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || undefined,
            city: data.city || undefined,
            country: data.country || undefined,
            bio: data.bio || undefined,
            primaryRoleId: data.roleId,
        });
    }

    static async updateUserRole(userId: string, roleId: string): Promise<void> {
        await httpClient.patch(`${this.BASE_URL}/${userId}/role`, { roleId });
    }

    static async toggleUserStatus(userId: string): Promise<void> {
        await httpClient.patch(`${this.BASE_URL}/${userId}/toggle-active`);
    }

    // --- Roles ---
    static async getRoles(): Promise<Role[]> {
        const response = await httpClient.get<any>(`${this.ROLES_URL}`);
        const data = response.data || response;
        return (Array.isArray(data) ? data : data.items || []).map((r: any) => ({
            ...r,
            isSystem: r.isSystem ?? !r.isCustom,
            createdAt: new Date(r.createdAt)
        }));
    }

    static async createRole(data: CreateRoleDto): Promise<Role> {
        return await httpClient.postWrapped<Role>(`${this.ROLES_URL}`, data);
    }

    static async deleteRole(roleId: string): Promise<void> {
        await httpClient.delete(`${this.ROLES_URL}/${roleId}`);
    }
}
