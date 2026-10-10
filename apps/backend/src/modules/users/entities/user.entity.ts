import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserRole } from './user-role.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  lastName: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  avatar: string; // URL to avatar image

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  city: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  country: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  emailVerificationExpires: Date;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  refreshTokenExpires: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Token versioning for role/permission changes
  @Column({ type: 'int', default: 1 })
  tokenVersion: number;

  // Account type metadata (for customer, student, subscriber flags)
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    isCustomer?: boolean;
    isStudent?: boolean;
    isSubscriber?: boolean;
    customerNumber?: string;
    schoolName?: string;
    studentId?: string;
    subscriptionPreferences?: {
      optIn?: boolean;
      categories?: string[];
    };
    // Complete profile data
    customerData?: {
      customerNumber?: string;
      companyName?: string;
      taxNumber?: string;
      companyPhone?: string;
      companyAddress?: string;
      companyCity?: string;
    };
    studentData?: {
      schoolName?: string;
      studentId?: string;
    };
    newsletterPreferences?: {
      email?: boolean;
      productUpdates?: boolean;
      eventUpdates?: boolean;
    };
    // Additional roles (for multi-role support)
    additionalRoles?: string[];
    // Profile completion tracking
    profileCompleted?: boolean;
    profileCompletedAt?: string;
    [key: string]: any; // Allow additional dynamic properties
  };

  // Customer specific fields
  @Column({ type: 'varchar', nullable: true, unique: true })
  customerNumber: string;

  // Student specific fields
  @Column({ type: 'varchar', nullable: true })
  schoolName: string;

  @Column({ type: 'varchar', nullable: true })
  studentId: string;

  // Subscriber preferences
  @Column({ type: 'boolean', default: false })
  isSubscribedToNewsletter: boolean;

  // Legacy role field (kept for backward compatibility, deprecated)
  @Column({ type: 'varchar', nullable: true })
  role: string;

  // DEPRECATED: Single role relationship (kept for backward compatibility)
  @Column({ type: 'uuid', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn([
    { name: 'roleId', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  roleEntity: Relation<Role>;

  // NEW: Many-to-Many relationship for multi-role support
  @OneToMany(() => UserRole, userRole => userRole.user, { eager: true })
  userRoles: Relation<UserRole>[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Relation<Notification>[];

  // Multi-Tenancy
  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, org => org.users)
  @JoinColumn([
    { name: 'organizationId', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'slug' },
  ])
  organization: Relation<Organization>;

  // Computed property for full name
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // NEW: Computed property for primary role
  @Expose()
  get primaryRole(): Role | null {
    const primary = this.userRoles?.find(ur => ur.isPrimary && ur.role?.isActive !== false);
    return (primary?.role as unknown as Role) || null;
  }

  // NEW: Computed property for all roles
  @Expose()
  get roles(): Role[] {
    return this.userRoles
      ?.map(ur => ur.role as unknown as Role)
      .filter(role => Boolean(role) && role.isActive !== false) || [];
  }

  // NEW: Computed property for all role names
  @Expose()
  get roleNames(): string[] {
    return this.roles.map(r => r.name);
  }
}
