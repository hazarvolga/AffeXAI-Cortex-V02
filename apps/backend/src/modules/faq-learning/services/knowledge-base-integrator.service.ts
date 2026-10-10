import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, IsNull, Repository } from "typeorm";
import {
  LearnedFaqEntry,
  FaqEntryStatus,
} from "../entities/learned-faq-entry.entity";
import { KnowledgeBaseArticle } from "../../tickets/entities/knowledge-base-article.entity";
import { TicketCategory } from "../../tickets/entities/ticket-category.entity";
import { FaqLearningConfig } from "../entities/faq-learning-config.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
import { requireFaqReviewer, requireFaqTenant } from "./faq-review-policy";

export interface FaqToArticleMapping {
  faqId: string;
  articleId: string;
  mappingType: "direct" | "merged" | "referenced";
  createdAt: Date;
}
export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string[];
}
export interface ArticleConversionResult {
  success: boolean;
  articleId?: string;
  article?: KnowledgeBaseArticle;
  mapping?: FaqToArticleMapping;
  error?: string;
  warnings?: string[];
}
export interface IntegrationStats {
  totalFaqs: number;
  convertedToArticles: number;
  pendingConversion: number;
  categorySuggestions: number;
  lastSync: Date;
}
interface ConversionOptions {
  categoryId?: string;
  authorId?: string;
  publishImmediately?: boolean;
  customTitle?: string;
  customContent?: string;
}
interface StoredMapping {
  articleId: string;
  convertedAt: string | Date;
  mappingType?: "direct";
}
function mappingOf(faq: LearnedFaqEntry): StoredMapping | undefined {
  return (
    faq.metadata as LearnedFaqEntry["metadata"] & {
      kbIntegration?: StoredMapping;
    }
  )?.kbIntegration;
}
@Injectable()
export class KnowledgeBaseIntegratorService {
  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(KnowledgeBaseArticle)
    private articleRepository: Repository<KnowledgeBaseArticle>,
    @InjectRepository(TicketCategory)
    private categoryRepository: Repository<TicketCategory>,
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private readonly tenantService: TenantService,
  ) {}

  async convertFaqToArticle(
    faqId: string,
    options: ConversionOptions = {},
  ): Promise<ArticleConversionResult> {
    const tenantId = requireFaqTenant(this.tenantService);
    return this.faqRepository.manager.transaction(async (manager) => {
      const faq = await manager
        .getRepository(LearnedFaqEntry)
        .findOne({
          where: { id: faqId, tenantId, deletedAt: IsNull() },
          lock: { mode: "pessimistic_write" },
        });
      if (!faq) throw new NotFoundException("FAQ not found");
      if (
        ![FaqEntryStatus.APPROVED, FaqEntryStatus.PUBLISHED].includes(
          faq.status,
        )
      )
        throw new BadRequestException("FAQ must be reviewed before conversion");
      if (options.authorId && options.authorId !== faq.reviewedBy)
        throw new BadRequestException(
          "Article author must be the recorded reviewer",
        );
      if (options.publishImmediately && faq.status !== FaqEntryStatus.PUBLISHED)
        throw new BadRequestException("Explicit FAQ publication required");
      const result = await this.syncReviewedFaq(manager, faq, options);
      await manager.getRepository(LearnedFaqEntry).save(result.faq);
      return {
        success: true,
        articleId: result.article.id,
        article: result.article,
        mapping: {
          faqId,
          articleId: result.article.id,
          mappingType: "direct",
          createdAt: new Date(mappingOf(result.faq)!.convertedAt),
        },
      };
    });
  }

  /** Caller holds the same tenant FAQ write lock; article and mapping commit together. */
  async syncReviewedFaq(
    manager: EntityManager,
    faq: LearnedFaqEntry,
    options: ConversionOptions = {},
  ): Promise<{ faq: LearnedFaqEntry; article: KnowledgeBaseArticle }> {
    const tenantId = requireFaqTenant(this.tenantService);
    if (!manager.queryRunner?.isTransactionActive)
      throw new BadRequestException("FAQ integration requires a transaction");
    if (faq.tenantId !== tenantId) throw new NotFoundException("FAQ not found");
    await requireFaqReviewer(manager, faq.reviewedBy, tenantId);
    const articles = manager.getRepository(KnowledgeBaseArticle);
    const mapping = mappingOf(faq);
    let previous: KnowledgeBaseArticle | null = null;
    if (mapping) {
      previous = await articles.findOne({
        where: { id: mapping.articleId, tenantId },
        lock: { mode: "pessimistic_write" },
      });
      if (
        !previous ||
        previous.metadata?.sourceFaqId !== faq.id ||
        previous.metadata?.sourceType !== "faq_learning"
      )
        throw new BadRequestException("FAQ article provenance mismatch");
    }
    if (
      ![FaqEntryStatus.APPROVED, FaqEntryStatus.PUBLISHED].includes(faq.status)
    )
      throw new BadRequestException("FAQ must be reviewed before integration");
    let categoryId = options.categoryId || previous?.categoryId;
    const categories = manager.getRepository(TicketCategory);
    if (categoryId) {
      if (
        !(await categories.findOne({
          where: {
            id: categoryId,
            tenantId,
            isActive: true,
            deletedAt: IsNull(),
          },
        }))
      )
        throw new BadRequestException(
          "Active same-tenant ticket category required",
        );
    } else if (faq.category) {
      categoryId = (
        await categories.findOne({
          where: {
            name: faq.category,
            tenantId,
            isActive: true,
            deletedAt: IsNull(),
          },
        })
      )?.id;
    }
    if (
      (options.customTitle !== undefined &&
        options.customTitle !== faq.question) ||
      (options.customContent !== undefined &&
        options.customContent !== faq.answer)
    )
      throw new BadRequestException(
        "Content changes require an explicit FAQ review edit",
      );
    const title = faq.question.trim();
    const content = faq.answer.trim();
    if (!title || title.length > 500 || !content)
      throw new BadRequestException("Valid FAQ title and answer required");
    const published = faq.status === FaqEntryStatus.PUBLISHED;
    const article = await articles.save(
      articles.create({
        ...previous,
        tenantId,
        title,
        content,
        summary: faq.answer.slice(0, 150),
        slug: `faq-${faq.id}`,
        categoryId,
        authorId: faq.reviewedBy,
        tags: (faq.keywords || []).filter(
          (value) => typeof value === "string" && !value.includes(","),
        ),
        status: published ? "published" : "draft",
        isPublished: published,
        publishedAt: published ? faq.publishedAt || new Date() : null,
        metadata: {
          sourceType: "faq_learning",
          sourceFaqId: faq.id,
          originalConfidence: faq.confidence,
        },
      }),
    );
    const updated = Object.assign(new LearnedFaqEntry(), {
      ...faq,
      metadata: {
        ...faq.metadata,
        kbIntegration: {
          articleId: article.id,
          convertedAt: mapping?.convertedAt || new Date().toISOString(),
          mappingType: "direct" as const,
        },
      },
    });
    return { faq: updated, article };
  }

  async revokeMappedArticle(
    manager: EntityManager,
    faq: LearnedFaqEntry,
  ): Promise<void> {
    const tenantId = requireFaqTenant(this.tenantService);
    if (!manager.queryRunner?.isTransactionActive || faq.tenantId !== tenantId)
      throw new BadRequestException("Scoped FAQ transaction required");
    const mapping = mappingOf(faq);
    if (!mapping) return;
    const articles = manager.getRepository(KnowledgeBaseArticle);
    const article = await articles.findOne({
      where: { id: mapping.articleId, tenantId },
      lock: { mode: "pessimistic_write" },
    });
    if (
      !article ||
      article.metadata?.sourceFaqId !== faq.id ||
      article.metadata?.sourceType !== "faq_learning"
    )
      throw new BadRequestException("FAQ article provenance mismatch");
    await articles.save({
      ...article,
      status: "archived",
      isPublished: false,
      publishedAt: null,
    });
  }

  async suggestCategory(
    question: string,
    answer: string,
    currentCategory?: string,
  ): Promise<CategorySuggestion | null> {
    const tenantId = requireFaqTenant(this.tenantService);
    const categories = await this.categoryRepository.find({
      where: { tenantId, isActive: true, deletedAt: IsNull() },
    });
    const text = `${question} ${answer}`.toLowerCase();
    const category =
      categories.find((item) => item.name === currentCategory) ||
      categories.find((item) => text.includes(item.name.toLowerCase()));
    return category
      ? {
          categoryId: category.id,
          categoryName: category.name,
          confidence: 50,
          reasoning: ["Same-tenant category name match"],
        }
      : null;
  }
  async bulkConvertFaqs(
    faqIds: string[],
    options: {
      authorId?: string;
      publishImmediately?: boolean;
      defaultCategoryId?: string;
    } = {},
  ) {
    requireFaqTenant(this.tenantService);
    if (faqIds.length > 100) throw new BadRequestException("Maximum 100 FAQs");
    const successful: ArticleConversionResult[] = [];
    const failed: Array<{ faqId: string; error: string }> = [];
    for (const faqId of [...new Set(faqIds)])
      try {
        successful.push(
          await this.convertFaqToArticle(faqId, {
            ...options,
            categoryId: options.defaultCategoryId,
          }),
        );
      } catch {
        failed.push({ faqId, error: "FAQ conversion failed" });
      }
    return { successful, failed };
  }
  async syncFaqUpdates() {
    const tenantId = requireFaqTenant(this.tenantService);
    const faqs = await this.faqRepository.find({
      where: {
        tenantId,
        status: FaqEntryStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
    });
    let updated = 0;
    const errors: Array<{ faqId: string; error: string }> = [];
    for (const faq of faqs)
      if (mappingOf(faq)) {
        try {
          await this.convertFaqToArticle(faq.id);
          updated++;
        } catch {
          errors.push({ faqId: faq.id, error: "FAQ synchronization failed" });
        }
      }
    return { updated, errors };
  }
  async getIntegrationStats(): Promise<IntegrationStats> {
    const tenantId = requireFaqTenant(this.tenantService);
    const faqs = await this.faqRepository.find({
      where: {
        tenantId,
        status: FaqEntryStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
    });
    const converted = faqs.filter(mappingOf).length;
    return {
      totalFaqs: faqs.length,
      convertedToArticles: converted,
      pendingConversion: faqs.length - converted,
      categorySuggestions: faqs.filter((faq) => !faq.category).length,
      lastSync: new Date(),
    };
  }
  async getCategorySuggestions(limit = 10) {
    const tenantId = requireFaqTenant(this.tenantService);
    const faqs = await this.faqRepository.find({
      where: {
        tenantId,
        status: FaqEntryStatus.PUBLISHED,
        category: IsNull(),
        deletedAt: IsNull(),
      },
      take: Math.max(1, Math.min(limit, 100)),
      order: { confidence: "DESC" },
    });
    const results: Array<{
      faq: LearnedFaqEntry;
      suggestions: CategorySuggestion[];
    }> = [];
    for (const faq of faqs) {
      const suggestion = await this.suggestCategory(faq.question, faq.answer);
      if (suggestion) results.push({ faq, suggestions: [suggestion] });
    }
    return results;
  }
}
