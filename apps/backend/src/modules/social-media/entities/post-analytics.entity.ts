import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { SocialPost } from './social-post.entity';

@Entity('post_analytics')
export class PostAnalytics extends BaseEntity {
    @Column({ type: 'uuid' })
    postId: string;

    @ManyToOne(() => SocialPost, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: SocialPost;

    @Column({ type: 'int', default: 0 })
    likes: number;

    @Column({ type: 'int', default: 0 })
    shares: number;

    @Column({ type: 'int', default: 0 })
    impressions: number;

    @Column({ type: 'int', default: 0 })
    comments: number;

    @Column({ type: 'int', default: 0 })
    clicks: number;

    @Column({ type: 'float', default: 0 })
    engagementRate: number;

    @Column({ type: 'timestamp' })
    snapshotAt: Date;
}
