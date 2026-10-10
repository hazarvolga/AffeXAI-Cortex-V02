import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SocialAccount } from './social-account.entity';
import { SocialPostFeedback } from './social-post-feedback.entity';
import { SocialPostStatus } from '../enums/post-status.enum';
import { PostAnalytics } from './post-analytics.entity';

@Entity('social_posts')
export class SocialPost extends BaseEntity {
    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    accountId: string;

    @OneToMany(() => PostAnalytics, analytics => analytics.post)
    analyticsHistory: PostAnalytics[];

    @OneToMany(() => SocialPostFeedback, feedback => feedback.post)
    feedback: SocialPostFeedback[];

    @ManyToOne(() => SocialAccount, (account) => account.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account: SocialAccount;

    @Column({ type: 'text' })
    content: string;

    @Column('text', { array: true, default: [] })
    mediaUrls: string[];

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    publishedAt: Date;

    @Column({
        type: 'enum',
        enum: SocialPostStatus,
        default: SocialPostStatus.DRAFT,
    })
    status: SocialPostStatus;

    @Column({ type: 'text', nullable: true })
    platformPostId: string;

    @Column({ type: 'jsonb', nullable: true })
    analytics: {
        likes?: number;
        shares?: number;
        impressions?: number;
        comments?: number;
        updatedAt?: Date;
    };

    @Column({ type: 'text', nullable: true })
    errorMessage: string;
}
