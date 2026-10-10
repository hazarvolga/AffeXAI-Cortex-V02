import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { TicketCategory } from "./ticket-category.entity";

/**
 * Knowledge Base Article Entity
 * Self-service articles for customers
 */
@Entity("knowledge_base_articles")
export class KnowledgeBaseArticle {
  @Column({ name: "tenant_id", type: "varchar", nullable: true })
  tenantId: string | null;

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", nullable: true })
  summary: string;

  @Column({ type: "varchar", length: 500 })
  slug: string;

  @Column({ type: "uuid", nullable: true })
  categoryId: string;

  @ManyToOne(() => TicketCategory, { nullable: true })
  @JoinColumn({ name: "categoryId" })
  category: TicketCategory;

  @Column({ type: "uuid" })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "authorId" })
  author: User;

  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  @Column({ type: "boolean", default: false })
  isPublished: boolean;

  @Column({ type: "boolean", default: false })
  isFeatured: boolean;

  @Column({ type: "integer", default: 0 })
  viewCount: number;

  @Column({ type: "integer", default: 0 })
  helpfulCount: number;

  @Column({ type: "integer", default: 0 })
  notHelpfulCount: number;

  @Column({ type: "integer", default: 0 })
  searchScore: number; // For search ranking

  @Column({ type: "simple-array", nullable: true })
  relatedArticleIds: string[];

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @Column({ type: "varchar", length: 50, default: "draft" })
  status: "draft" | "published" | "archived";

  @Column({ type: "timestamp", nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
