import { User } from "../../users/entities/user.entity";
import { TicketCategory } from "../entities/ticket-category.entity";
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In } from "typeorm";
import { KnowledgeBaseArticle } from "../entities/knowledge-base-article.entity";
import { slugify } from "../../../common/utils/slugify.util";
import { TenantService } from "../../../core/tenant/tenant.service";

/**
 * Knowledge Base Service
 * Manages self-service help articles
 */

export interface CreateArticleDto {
  title: string;
  content: string;
  summary?: string;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  status?: "draft" | "published" | "archived";
}

export interface UpdateArticleDto {
  title?: string;
  content?: string;
  summary?: string;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  status?: "draft" | "published" | "archived";
}

export interface ArticleSearchFilters {
  query?: string;
  categoryId?: string;
  tags?: string[];
  status?: string;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectRepository(KnowledgeBaseArticle)
    private readonly articleRepository: Repository<KnowledgeBaseArticle>,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const tenant = this.tenantService.getTenantId();
    if (!tenant || !/^[A-Za-z0-9_-]{1,128}$/.test(tenant))
      throw new ForbiddenException("Tenant required");
    return tenant;
  }

  private present(article: KnowledgeBaseArticle): KnowledgeBaseArticle {
    return {
      ...article,
      ...(article.author
        ? {
            author: {
              id: article.author.id,
              firstName: article.author.firstName,
              lastName: article.author.lastName,
              avatar: article.author.avatar,
            } as User,
          }
        : {}),
    };
  }

  private boundedNumber(
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ): number {
    if (value === undefined) return fallback;
    const number =
      typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
    if (
      typeof number !== "number" ||
      !Number.isInteger(number) ||
      number < min ||
      number > max
    )
      throw new BadRequestException("Invalid article pagination");
    return number;
  }

  private normalizeFilters(input: ArticleSearchFilters): ArticleSearchFilters {
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).some(
        (key) =>
          ![
            "query",
            "categoryId",
            "tags",
            "status",
            "isFeatured",
            "limit",
            "offset",
          ].includes(key),
      )
    )
      throw new BadRequestException("Invalid article filters");
    if (
      input.query !== undefined &&
      (typeof input.query !== "string" || input.query.length > 500)
    )
      throw new BadRequestException("Invalid article query");
    if (
      input.tags !== undefined &&
      (!Array.isArray(input.tags) ||
        input.tags.length > 50 ||
        input.tags.some(
          (tag) =>
            typeof tag !== "string" || tag.length > 100 || tag.includes(","),
        ))
    )
      throw new BadRequestException("Invalid article tags");
    if (
      input.status !== undefined &&
      !["draft", "published", "archived"].includes(input.status)
    )
      throw new BadRequestException("Invalid article status");
    let isFeatured = input.isFeatured;
    if ((isFeatured as unknown) === "true") isFeatured = true;
    if ((isFeatured as unknown) === "false") isFeatured = false;
    if (isFeatured !== undefined && typeof isFeatured !== "boolean")
      throw new BadRequestException("Invalid featured filter");
    return {
      ...input,
      isFeatured,
      limit: this.boundedNumber(input.limit, 20, 1, 100),
      offset: this.boundedNumber(input.offset, 0, 0, 100000),
    };
  }

  private async validateFields(
    dto: UpdateArticleDto,
    authorId?: string,
  ): Promise<void> {
    const allowed = [
      "title",
      "content",
      "summary",
      "categoryId",
      "tags",
      "isFeatured",
      "status",
    ];
    if (
      !dto ||
      typeof dto !== "object" ||
      Object.keys(dto).some((key) => !allowed.includes(key))
    )
      throw new BadRequestException("Unsupported article fields");
    if (
      dto.status !== undefined &&
      !["draft", "published", "archived"].includes(dto.status)
    )
      throw new BadRequestException("Invalid article status");
    for (const key of ["title", "content", "summary"] as const)
      if (
        dto[key] !== undefined &&
        (typeof dto[key] !== "string" ||
          dto[key].length > (key === "content" ? 200000 : 2000))
      )
        throw new BadRequestException("Invalid article text");
    if (
      dto.tags !== undefined &&
      (!Array.isArray(dto.tags) ||
        dto.tags.length > 50 ||
        dto.tags.some(
          (tag) =>
            typeof tag !== "string" || tag.length > 100 || tag.includes(","),
        ))
    )
      throw new BadRequestException("Invalid article tags");
    const tenantId = this.getActiveTenantId();
    if (
      authorId &&
      !(await this.articleRepository.manager.findOne(User, {
        where: { id: authorId, tenantId },
      }))
    )
      throw new NotFoundException("Article author unavailable");
    if (
      dto.categoryId &&
      !(await this.articleRepository.manager.findOne(TicketCategory, {
        where: { id: dto.categoryId, tenantId },
      }))
    )
      throw new NotFoundException("Article category unavailable");
  }

  /**
   * Create a new article
   */
  async createArticle(
    authorId: string,
    dto: CreateArticleDto,
  ): Promise<KnowledgeBaseArticle> {
    const tenantId = this.getActiveTenantId();

    await this.validateFields(dto, authorId);
    if (!dto.title?.trim() || !dto.content?.trim())
      throw new BadRequestException("Article title and content required");
    const slug = this.generateSlug(dto.title);

    const article = this.articleRepository.create({
      ...dto,
      status: dto.status ?? "draft",
      authorId,
      slug,
      tenantId,
      isPublished: dto.status === "published",
      publishedAt: dto.status === "published" ? new Date() : null,
    } as any) as unknown as KnowledgeBaseArticle;

    await this.articleRepository.save(article);
    this.logger.log(`Created article: ${article.id} - ${article.title}`);

    return this.present(article);
  }

  /**
   * Update an article
   */
  async updateArticle(
    id: string,
    dto: UpdateArticleDto,
  ): Promise<KnowledgeBaseArticle> {
    const tenantId = this.getActiveTenantId();
    const article = await this.articleRepository.findOne({
      where: { id, tenantId } as any,
    });

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    await this.validateFields(dto);

    const updated = {
      ...article,
      ...dto,
      ...(dto.title && dto.title !== article.title
        ? { slug: this.generateSlug(dto.title) }
        : {}),
      ...(dto.status !== undefined
        ? {
            isPublished: dto.status === "published",
            publishedAt:
              dto.status === "published" && !article.isPublished
                ? new Date()
                : article.publishedAt,
          }
        : {}),
    };
    const { slug, isPublished, publishedAt } = updated;
    const patch = {
      ...dto,
      ...(dto.title && dto.title !== article.title ? { slug } : {}),
      ...(dto.status !== undefined ? { isPublished, publishedAt } : {}),
    };
    const result = await this.articleRepository.update({ id, tenantId }, patch);
    if (!result.affected) throw new NotFoundException("Article not found");

    this.logger.log(`Updated article: ${article.id}`);
    return updated;
  }

  /**
   * Delete an article
   */
  async deleteArticle(id: string): Promise<void> {
    const result = await this.articleRepository.delete({
      id,
      tenantId: this.getActiveTenantId(),
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    this.logger.log(`Deleted article: ${id}`);
  }

  /**
   * Get article by ID
   */
  async getArticle(
    id: string,
    publishedOnly = true,
  ): Promise<KnowledgeBaseArticle> {
    const article = await this.articleRepository.findOne({
      where: {
        id,
        tenantId: this.getActiveTenantId(),
        ...(publishedOnly ? { isPublished: true } : {}),
      },
      relations: ["author", "category"],
    });

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    return this.present(article);
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug: string): Promise<KnowledgeBaseArticle> {
    const tenantId = this.getActiveTenantId();
    const article = await this.articleRepository.findOne({
      where: { slug, isPublished: true, tenantId } as any,
      relations: ["author", "category"],
    });

    if (!article) {
      throw new NotFoundException(`Article not found`);
    }

    // Never write a stale article snapshot while recording a public view.
    const counted = await this.articleRepository.increment(
      { id: article.id, tenantId, isPublished: true },
      "viewCount",
      1,
    );
    if (!counted.affected) throw new NotFoundException("Article not found");
    return this.present({ ...article, viewCount: article.viewCount + 1 });
  }

  /**
   * Search articles
   */
  async searchArticles(
    filters: ArticleSearchFilters,
    publishedOnly = true,
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    const tenantId = this.getActiveTenantId();
    filters = this.normalizeFilters(filters);
    if (publishedOnly && filters.status && filters.status !== "published")
      throw new BadRequestException(
        "Public article search only supports published content",
      );
    const query = this.articleRepository
      .createQueryBuilder("article")
      .where("article.tenantId = :tenantId", { tenantId })
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.category", "category");

    // Search query
    if (filters.query) {
      query.andWhere(
        "(article.title ILIKE :query OR article.content ILIKE :query OR article.summary ILIKE :query)",
        { query: `%${filters.query}%` },
      );
    }

    // Category filter
    if (filters.categoryId) {
      query.andWhere("article.categoryId = :categoryId", {
        categoryId: filters.categoryId,
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query.andWhere("string_to_array(article.tags, ',') && :tags::text[]", {
        tags: filters.tags,
      });
    }

    // Status filter
    if (filters.status) {
      query.andWhere("article.status = :status", { status: filters.status });
    }
    if (publishedOnly) {
      // Public callers cannot retrieve unpublished content
      query.andWhere("article.isPublished = :isPublished", {
        isPublished: true,
      });
    }

    // Featured filter
    if (filters.isFeatured !== undefined) {
      query.andWhere("article.isFeatured = :isFeatured", {
        isFeatured: filters.isFeatured,
      });
    }

    // Order by relevance and popularity
    query
      .orderBy("article.searchScore", "DESC")
      .addOrderBy("article.viewCount", "DESC")
      .addOrderBy("article.publishedAt", "DESC");

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query.take(limit).skip(offset);

    const [articles, total] = await query.getManyAndCount();

    return {
      articles: articles.map((article) => this.present(article)),
      total,
    };
  }

  /**
   * Get featured articles
   */
  async getFeaturedArticles(
    limit: number = 5,
  ): Promise<KnowledgeBaseArticle[]> {
    const tenantId = this.getActiveTenantId();
    const articles = await this.articleRepository.find({
      where: { isFeatured: true, isPublished: true, tenantId } as any,
      relations: ["author", "category"],
      order: { viewCount: "DESC" },
      take: this.boundedNumber(limit, 10, 1, 100),
    });
    return articles.map((article) => this.present(article));
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(
    limit: number = 10,
  ): Promise<KnowledgeBaseArticle[]> {
    const articles = await this.articleRepository.find({
      where: { isPublished: true, tenantId: this.getActiveTenantId() },
      relations: ["author", "category"],
      order: { viewCount: "DESC" },
      take: this.boundedNumber(limit, 10, 1, 100),
    });
    return articles.map((article) => this.present(article));
  }

  /**
   * Get related articles
   */
  async getRelatedArticles(
    articleId: string,
    limit: number = 5,
  ): Promise<KnowledgeBaseArticle[]> {
    const article = await this.getArticle(articleId);

    if (!article) {
      return [];
    }

    // Find articles with similar tags or same category
    const query = this.articleRepository
      .createQueryBuilder("article")
      .where("article.id != :articleId", { articleId })
      .andWhere("article.tenantId = :tenantId", {
        tenantId: this.getActiveTenantId(),
      })
      .andWhere("article.isPublished = :isPublished", { isPublished: true });

    if (article.tags && article.tags.length > 0) {
      query.andWhere("string_to_array(article.tags, ',') && :tags::text[]", {
        tags: article.tags,
      });
    } else if (article.categoryId) {
      query.andWhere("article.categoryId = :categoryId", {
        categoryId: article.categoryId,
      });
    }

    query
      .orderBy("article.viewCount", "DESC")
      .take(this.boundedNumber(limit, 5, 1, 100));

    return (await query.getMany()).map((article) => this.present(article));
  }

  /**
   * Mark article as helpful
   */
  async markHelpful(
    id: string,
    isHelpful: boolean,
  ): Promise<KnowledgeBaseArticle> {
    const article = await this.getArticle(id);

    if (typeof isHelpful !== "boolean")
      throw new BadRequestException("Feedback must be boolean");
    const helpful = isHelpful ? 1 : 0;
    const notHelpful = isHelpful ? 0 : 1;
    const result = await this.articleRepository.update(
      { id, tenantId: this.getActiveTenantId(), isPublished: true },
      {
        helpfulCount: () => `"helpfulCount" + ${helpful}`,
        notHelpfulCount: () => `"notHelpfulCount" + ${notHelpful}`,
        searchScore: () =>
          `ROUND(100.0 * ("helpfulCount" + ${helpful}) / ("helpfulCount" + "notHelpfulCount" + 1))`,
      },
    );
    if (!result.affected) throw new NotFoundException("Article not found");
    return this.present({
      ...article,
      helpfulCount: article.helpfulCount + helpful,
      notHelpfulCount: article.notHelpfulCount + notHelpful,
    });
  }

  /**
   * Get article statistics
   */
  async getStatistics(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalViews: number;
    avgHelpfulness: number;
  }> {
    const tenantId = this.getActiveTenantId();
    const [total, published, draft, archived] = await Promise.all([
      this.articleRepository.count({ where: { tenantId } as any }),
      this.articleRepository.count({
        where: { status: "published", tenantId } as any,
      }),
      this.articleRepository.count({
        where: { status: "draft", tenantId } as any,
      }),
      this.articleRepository.count({
        where: { status: "archived", tenantId } as any,
      }),
    ]);

    const articles = await this.articleRepository.find({
      where: { tenantId } as any,
    });
    const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
    const totalHelpful = articles.reduce((sum, a) => sum + a.helpfulCount, 0);
    const totalFeedback = articles.reduce(
      (sum, a) => sum + a.helpfulCount + a.notHelpfulCount,
      0,
    );

    const avgHelpfulness =
      totalFeedback > 0 ? Math.round((totalHelpful / totalFeedback) * 100) : 0;

    return {
      total,
      published,
      draft,
      archived,
      totalViews,
      avgHelpfulness,
    };
  }

  /**
   * Generate URL-friendly slug from title
   * Uses centralized slugify utility with Turkish character support
   */
  private generateSlug(title: string): string {
    const slug = slugify(title);
    return `${slug || "untitled"}-${Date.now()}`;
  }
}
