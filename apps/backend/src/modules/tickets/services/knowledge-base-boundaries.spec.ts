import { KnowledgeBaseService } from "./knowledge-base.service";
import { User } from "../../users/entities/user.entity";
describe("knowledge article tenant and publication boundary", () => {
  const query = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const repo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: () => query,
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
    manager: {
      findOne: jest.fn(async (entity) =>
        entity === User ? { id: "actor", tenantId: "tenant-a" } : null,
      ),
    },
  };
  const scope = { getTenantId: () => "tenant-a" };
  const service = new KnowledgeBaseService(repo as never, scope as never);
  beforeEach(() => {
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue({
      id: "article",
      tenantId: "tenant-a",
      isPublished: true,
      status: "published",
      title: "Original",
      tags: ["support"],
    });
  });
  it("public id reads require tenant and published state", async () => {
    await service.getArticle("article");
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "article", tenantId: "tenant-a", isPublished: true },
      }),
    );
  });
  it("deletion is tenant scoped", async () => {
    await service.deleteArticle("article");
    expect(repo.delete).toHaveBeenCalledWith({
      id: "article",
      tenantId: "tenant-a",
    });
  });
  it("popular queries are tenant scoped", async () => {
    await service.getPopularArticles();
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-a",
          isPublished: true,
        }),
      }),
    );
  });
  it("related query adds tenant predicate", async () => {
    await service.getRelatedArticles("article");
    expect(query.andWhere).toHaveBeenCalledWith(
      "article.tenantId = :tenantId",
      { tenantId: "tenant-a" },
    );
  });
  it("admin search without status includes drafts", async () => {
    await service.searchArticles({}, false);
    expect(query.andWhere).not.toHaveBeenCalledWith(
      "article.isPublished = :isPublished",
      expect.anything(),
    );
  });
  it("public search cannot request drafts", async () => {
    await expect(service.searchArticles({ status: "draft" })).rejects.toThrow();
  });
  it("partial update does not unpublish existing article", async () => {
    const result = await service.updateArticle("article", {
      summary: "Updated",
    });
    expect(result.isPublished).toBe(true);
  });
  it("rejects injected ownership metadata", async () => {
    await expect(
      service.updateArticle("article", { tenantId: "tenant-b" } as never),
    ).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("rejects category from a different tenant", async () => {
    await expect(
      service.createArticle("actor", {
        title: "Fixture",
        content: "Body",
        categoryId: "foreign-category",
      }),
    ).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("fails closed without tenant before querying", async () => {
    const missing = new KnowledgeBaseService(
      repo as never,
      { getTenantId: () => undefined } as never,
    );
    await expect(missing.getArticle("article")).rejects.toThrow();
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it("converts simple-array tags to an SQL array for overlap", async () => {
    await service.searchArticles({ tags: ["support"] });
    expect(query.andWhere).toHaveBeenCalledWith(
      "string_to_array(article.tags, ',') && :tags::text[]",
      { tags: ["support"] },
    );
  });
  it("public explicit published status still requires publication flag", async () => {
    await service.searchArticles({ status: "published" });
    expect(query.andWhere).toHaveBeenCalledWith(
      "article.isPublished = :isPublished",
      { isPublished: true },
    );
  });
  it("does not expose author contact or security metadata", async () => {
    repo.findOne.mockResolvedValue({
      id: "article",
      author: {
        id: "author",
        firstName: "Ada",
        email: "private",
        phone: "private",
        password: "private",
        metadata: { private: true },
      },
    });
    const article = await service.getArticle("article");
    expect(article.author).toEqual({
      id: "author",
      firstName: "Ada",
      lastName: undefined,
      avatar: undefined,
    });
  });
  it("view counting never saves stale publication state", async () => {
    await service.getArticleBySlug("fixture");
    expect(repo.save).not.toHaveBeenCalled();
  });
  it.each([
    { limit: 1001 },
    { offset: -1 },
    { tags: "not-array" },
    { isFeatured: "invalid" },
  ])("rejects malformed search filter %j", async (filters) => {
    await expect(service.searchArticles(filters as never)).rejects.toThrow();
  });
  it.each([
    { status: "invalid" },
    { title: 3 },
    { content: "x".repeat(200001) },
    { tags: ["bad,tag"] },
    { tags: Array(51).fill("tag") },
  ])("rejects invalid edit fields %j", async (dto) => {
    await expect(
      service.updateArticle("article", dto as never),
    ).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });
  it.each([
    { query: 123 },
    { query: "q".repeat(501) },
    { status: "unknown" },
    { limit: 0 },
    { limit: "1x" },
    { tags: ["bad,tag"] },
    { surprise: true },
  ])("rejects unsupported filter before execution %j", async (filters) => {
    await expect(service.searchArticles(filters as never)).rejects.toThrow();
    expect(query.getManyAndCount).not.toHaveBeenCalled();
  });
  it("normalizes HTTP pagination and featured booleans", async () => {
    await service.searchArticles({
      limit: "5",
      offset: "10",
      isFeatured: "false",
    } as never);
    expect(query.take).toHaveBeenCalledWith(5);
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.andWhere).toHaveBeenCalledWith(
      "article.isFeatured = :isFeatured",
      { isFeatured: false },
    );
  });
  it("explicit archive changes publication while preserving other fields", async () => {
    const result = await service.updateArticle("article", {
      status: "archived",
    });
    expect(result.isPublished).toBe(false);
    expect(repo.update).toHaveBeenCalledWith(
      { id: "article", tenantId: "tenant-a" },
      expect.objectContaining({ status: "archived", isPublished: false }),
    );
  });
  it("does not report a counted view after concurrent unpublish", async () => {
    repo.increment.mockResolvedValueOnce({ affected: 0 });
    await expect(service.getArticleBySlug("fixture")).rejects.toThrow();
  });
  it("rejects nonboolean feedback before mutation", async () => {
    await expect(
      service.markHelpful("article", "false" as never),
    ).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });
});
