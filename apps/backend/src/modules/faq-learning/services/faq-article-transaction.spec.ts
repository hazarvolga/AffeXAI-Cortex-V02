import { KnowledgeBaseIntegratorService } from "./knowledge-base-integrator.service";
import { LearnedFaqEntry } from "../entities/learned-faq-entry.entity";
import { KnowledgeBaseArticle } from "../../tickets/entities/knowledge-base-article.entity";
import { TicketCategory } from "../../tickets/entities/ticket-category.entity";
import { User } from "../../users/entities/user.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
import { IsNull } from "typeorm";
describe("FAQ article same-transaction integration", () => {
  const tenantService = new TenantService();
  const articles = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "article", ...value })),
  };
  const categories = { findOne: jest.fn() };
  const users = { findOne: jest.fn() };
  const manager = {
    queryRunner: { isTransactionActive: true },
    getRepository: (entity) =>
      entity === KnowledgeBaseArticle
        ? articles
        : entity === TicketCategory
          ? categories
          : users,
  };
  const service = Object.assign(
    Object.create(KnowledgeBaseIntegratorService.prototype),
    { tenantService },
  );
  const faq = () =>
    Object.assign(new LearnedFaqEntry(), {
      id: "faq",
      tenantId: "ta",
      status: "approved",
      question: "Question",
      answer: "Answer",
      keywords: ["safe", "one,two"],
      reviewedBy: "reviewer",
      metadata: { originalConversation: "private source" },
    });
  const run = (value = faq(), options = {}) =>
    tenantService.runWithTenant(
      { tenantId: "ta", source: "authenticated" },
      () => service.syncReviewedFaq(manager as never, value, options),
    );
  beforeEach(() => {
    jest.clearAllMocks();
    manager.queryRunner.isTransactionActive = true;
    users.findOne.mockResolvedValue({
      id: "reviewer",
      roleEntity: { name: "support_agent", tenantId: "ta", isActive: true },
    });
    articles.findOne.mockResolvedValue(null);
    categories.findOne.mockResolvedValue(null);
  });
  it("writes scoped draft with reviewer author and no private transcript metadata", async () => {
    const result = await run();
    expect(result.article).toMatchObject({
      tenantId: "ta",
      authorId: "reviewer",
      slug: "faq-faq",
      status: "draft",
      isPublished: false,
      publishedAt: null,
      tags: ["safe"],
    });
    expect(result.article.metadata).not.toHaveProperty("originalConversation");
    expect(result.faq.metadata).toHaveProperty(
      "kbIntegration.articleId",
      "article",
    );
  });
  it("rejects transactionless and foreign tenant calls", async () => {
    manager.queryRunner.isTransactionActive = false;
    await expect(run()).rejects.toThrow();
    manager.queryRunner.isTransactionActive = true;
    await expect(
      run(Object.assign(faq(), { tenantId: "tb" })),
    ).rejects.toThrow();
    expect(articles.save).not.toHaveBeenCalled();
  });
  it("rejects foreign category and queries actual TicketCategory", async () => {
    await expect(run(faq(), { categoryId: "foreign" })).rejects.toThrow();
    expect(categories.findOne).toHaveBeenCalledWith({
      where: {
        id: "foreign",
        tenantId: "ta",
        isActive: true,
        deletedAt: IsNull(),
      },
    });
    expect(articles.save).not.toHaveBeenCalled();
  });
  it("reuses existing own provenance mapping without creating second article", async () => {
    const value = faq();
    value.metadata = {
      kbIntegration: { articleId: "existing", convertedAt: new Date() },
    } as never;
    articles.findOne.mockResolvedValue({
      id: "existing",
      tenantId: "ta",
      metadata: { sourceFaqId: "faq", sourceType: "faq_learning" },
    });
    const result = await run(value);
    expect(result.article.id).toBe("existing");
  });
  it("rejects forged or foreign article mapping", async () => {
    const value = faq();
    value.metadata = {
      kbIntegration: { articleId: "foreign", convertedAt: new Date() },
    } as never;
    articles.findOne.mockResolvedValue({
      id: "foreign",
      metadata: { sourceFaqId: "other" },
    });
    await expect(run(value)).rejects.toThrow();
    expect(articles.save).not.toHaveBeenCalled();
  });
  it("published state consistently sets flag and timestamp", async () => {
    const result = await run(Object.assign(faq(), { status: "published" }));
    expect(result.article).toMatchObject({
      status: "published",
      isPublished: true,
      publishedAt: expect.any(Date),
    });
  });
  it.each([
    { customTitle: "Unreviewed title" },
    { customContent: "Unreviewed answer" },
  ])("rejects unreviewed conversion override %j", async (options) => {
    await expect(
      run(Object.assign(faq(), { status: "published" }), options),
    ).rejects.toThrow();
    expect(articles.save).not.toHaveBeenCalled();
  });
});
