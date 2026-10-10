import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SocialProvider } from '../enums/social-provider.enum';
import { SocialPost } from './social-post.entity';

@Entity('social_accounts')
export class SocialAccount extends BaseEntity {
    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({
        type: 'enum',
        enum: SocialProvider,
    })
    provider: SocialProvider;

    @Column({ type: 'text' })
    providerAccountId: string;

    @Column({ type: 'text', nullable: true })
    username: string;

    @Column({ type: 'text', select: false, nullable: true })
    tokenDek: string; // Encrypted DEK used for access/refresh tokens

    @Column({ type: 'text', select: false }) // Hide from default queries for security
    accessToken: string;

    @Column({ type: 'text', select: false, nullable: true }) // Hide from default queries
    refreshToken: string;

    @Column({ type: 'text', select: false, nullable: true })
    refreshTokenDek: string;

    @Column({ type: 'timestamp', nullable: true })
    tokenExpiresAt: Date;

    @Column({ type: 'jsonb', default: {} })
    profileData: {
        name?: string;
        username?: string;
        avatarUrl?: string;
        followersCount?: number;
        [key: string]: any;
    };

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => SocialPost, (post) => post.account)
    posts: SocialPost[];
}
