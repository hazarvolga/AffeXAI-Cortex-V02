import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from './user.entity';
import { Role } from '../../roles/entities/role.entity';

/**
 * UserRole Entity
 * Junction table for many-to-many relationship between Users and Roles
 * Supports multi-role assignment with primary role designation
 */
@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
@Index(['userId'])
@Index('IDX_user_roles_one_live_primary_per_tenant_user', ['tenantId', 'userId'], {
  unique: true,
  where: 'deleted_at IS NULL AND "isPrimary" = true',
})
export class UserRole extends BaseEntity {
  // id inherited from BaseEntity

  @Column({ name: 'tenant_id', type: 'varchar', nullable: false })
  declare tenantId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  assignedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedBy: string | null;

  @ManyToOne(() => User, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'userId', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  user: Relation<User>;

  @ManyToOne(() => Role, role => role.userRoles, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn([
    { name: 'roleId', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  role: Relation<Role>;

  // createdAt, updatedAt, tenantId inherited from BaseEntity
}
