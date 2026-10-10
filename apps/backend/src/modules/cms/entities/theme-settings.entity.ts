import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Menu } from './menu.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Theme Settings Entity
 * Manages header and footer configuration for the public website
 */
@Entity('theme_settings')
export class ThemeSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, name: 'tenant_id', nullable: false })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  // Header Configuration
  @Column({ type: 'jsonb', default: {} })
  headerConfig: {
    topBarLinks?: Array<{
      text: string;
      href: string;
      order: number;
      icon?: string;
    }>;
    ctaButtons?: {
      contact?: {
        show: boolean;
        text: string;
        href: string;
      };
      demo?: {
        show: boolean;
        text: string;
        href: string;
      };
    };
    authLinks?: {
      showLogin: boolean;
      showSignup: boolean;
      loginText: string;
      signupText: string;
    };
    layout?: {
      sticky: boolean;
      transparent: boolean;
      shadow: boolean;
    };
  };

  // Header Menu Assignment
  @ManyToOne(() => Menu, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'header_menu_id' })
  headerMenu: Menu;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  headerMenuId: string;

  // Footer Configuration
  @Column({ type: 'jsonb', default: {} })
  footerConfig: {
    sections?: Array<{
      title: string;
      menuId?: string; // Optional: Use menu
      customLinks?: Array<{
        name: string;
        href: string;
        order: number;
      }>;
    }>;
    showLanguageSelector?: boolean;
    languageText?: string;
    copyrightText?: string;
  };

  // Active Theme (only one can be active per tenant)
  @Column({ type: 'boolean', default: false })
  @Index('IDX_theme_settings_active')
  isActive: boolean;

  // Audit Fields
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ type: 'integer', nullable: true })
  createdById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Column({ type: 'integer', nullable: true })
  updatedById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
