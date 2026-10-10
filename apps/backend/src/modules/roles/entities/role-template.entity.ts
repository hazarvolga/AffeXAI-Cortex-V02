import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Relation } from 'typeorm';
import { Role } from './role.entity';

/**
 * RoleTemplate - Global role templates shared across all tenants
 * 
 * These are predefined role templates (Admin, Editor, Customer, etc.) that serve as
 * blueprints for tenant-specific roles. Templates cannot be modified or deleted by tenants.
 * 
 * When a new tenant is created, role instances are automatically created from these templates.
 */
@Entity('role_templates')
export class RoleTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true, length: 100 })
    name: string; // Unique identifier (e.g., 'admin', 'editor', 'customer')

    @Column({ type: 'varchar', length: 100 })
    displayName: string; // Display name (e.g., 'Admin', 'Editor', 'Customer')

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'jsonb', default: [] })
    defaultPermissions: string[]; // Default permissions for this template

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: true })
    isSystem: boolean; // System templates cannot be deleted

    // Roles created from this template
    @OneToMany(() => Role, role => role.template)
    roles: Relation<Role>[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
