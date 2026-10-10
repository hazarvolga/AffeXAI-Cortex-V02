import { Entity, Column, OneToMany, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { RoleTemplate } from './role-template.entity';
import { Expose } from 'class-transformer';

/**
 * Role - Tenant-scoped role instances
 * 
 * Roles can be:
 * 1. Template-based: Created from RoleTemplate (template field is set)
 * 2. Custom: Created by tenant (template field is null, isCustom = true)
 * 
 * Template-based roles inherit default permissions but can be customized per tenant.
 */
@Entity('roles')
export class Role extends BaseEntity {
  // id, createdAt, updatedAt, tenantId inherited from BaseEntity

  @Column({ name: 'tenant_id', type: 'varchar', nullable: false })
  declare tenantId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string; // Unique per tenant (not globally unique)

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName: string; // Display name (e.g., 'Admin', 'Editor')

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  permissions: string[]; // Can override template permissions

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_custom' })
  isCustom: boolean; // true for tenant-created roles, false for template-based

  @Expose()
  get isSystem(): boolean {
    return !this.isCustom;
  }

  // Template this role was created from (null for custom roles)
  @ManyToOne(() => RoleTemplate, template => template.roles, { nullable: true })
  template: Relation<RoleTemplate>;

  // DEPRECATED: Single role relationship (kept for backward compatibility)
  @OneToMany(() => User, user => user.roleEntity)
  users: Relation<User>[];

  // NEW: Many-to-Many relationship for multi-role support
  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles: Relation<UserRole>[];
}
