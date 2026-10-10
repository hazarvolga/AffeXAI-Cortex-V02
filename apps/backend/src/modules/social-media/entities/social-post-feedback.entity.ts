import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { SocialPost } from './social-post.entity';

@Entity('social_post_feedback')
export class SocialPostFeedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    postId: string;

    @ManyToOne(() => SocialPost, post => post.feedback)
    @JoinColumn({ name: 'postId' })
    post: SocialPost;

    @Column()
    externalId: string; // ID from the platform (e.g., tweet ID, comment ID)

    @Column({ type: 'text' })
    content: string;

    @Column()
    authorName: string;

    @Column({ nullable: true })
    authorId: string; // Platform specific user ID

    @Column({ nullable: true })
    sentimentScore: number; // -1 to 1

    @Column({ nullable: true })
    sentimentLabel: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

    @Column()
    platform: string;

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;
}
