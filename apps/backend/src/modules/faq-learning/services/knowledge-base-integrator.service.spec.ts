import { KnowledgeBaseIntegratorService } from "./knowledge-base-integrator.service";
import { TenantService } from "../../../core/tenant/tenant.service";
describe("KnowledgeBaseIntegratorService conversion entrypoint", () => {
  const tenants = new TenantService();
  const repo = { findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const manager = { getRepository: () => repo };
  const integrate = jest.fn();
  const service = Object.assign(
    Object.create(KnowledgeBaseIntegratorService.prototype),
    {
      tenantService: tenants,
      faqRepository: {
        manager: { transaction: async (callback) => callback(manager) },
      },
      syncReviewedFaq: integrate,
    },
  );
  const run = (options = {}) =>
    tenants.runWithTenant({ tenantId: "ta", source: "authenticated" }, () =>
      service.convertFaqToArticle("faq", options),
    );
  beforeEach(() => {
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue({
      id: "faq",
      tenantId: "ta",
      status: "approved",
      reviewedBy: "reviewer",
    });
    integrate.mockResolvedValue({
      article: { id: "article" },
      faq: {
        id: "faq",
        metadata: {
          kbIntegration: { articleId: "article", convertedAt: new Date() },
        },
      },
    });
  });
  it("fails without tenant rather than global lookup", async () => {
    await expect(service.convertFaqToArticle("faq")).rejects.toThrow();
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it("fails missing FAQ", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(run()).rejects.toThrow("not found");
  });
  it("rejects forged author override and publication shortcut", async () => {
    await expect(run({ authorId: "foreign" })).rejects.toThrow();
    await expect(run({ publishImmediately: true })).rejects.toThrow();
    expect(integrate).not.toHaveBeenCalled();
  });
  it("returns durable mapping and saves mapping in same manager", async () => {
    expect(await run()).toMatchObject({
      success: true,
      articleId: "article",
      mapping: { faqId: "faq", articleId: "article" },
    });
    expect(repo.save).toHaveBeenCalled();
  });
  // Full mapping/revocation and FK cases live in faq-article-transaction.spec and real DB harness.
});
