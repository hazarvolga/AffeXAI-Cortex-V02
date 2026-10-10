import { ReviewQueueService } from "./review-queue.service";
import {
  LearnedFaqEntry,
  FaqEntryStatus,
} from "../entities/learned-faq-entry.entity";
import { User } from "../../users/entities/user.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
import { IsNull } from "typeorm";
describe("reviewed FAQ atomic publication", () => {
  const tenantService = new TenantService();
  const faqs = { findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const users = { findOne: jest.fn() };
  const integration = {
    syncReviewedFaq: jest.fn(async (manager, faq) => ({
      faq: { ...faq, metadata: { kbIntegration: { articleId: "article" } } },
      article: { id: "article" },
    })),
    revokeMappedArticle: jest.fn(),
  };
  const manager = {
    queryRunner: { isTransactionActive: true },
    getRepository: (entity) => (entity === LearnedFaqEntry ? faqs : users),
  };
  const service = Object.assign(Object.create(ReviewQueueService.prototype), {
    tenantService,
    faqRepository: {
      ...faqs,
      manager: { transaction: async (callback) => callback(manager) },
    },
    userRepository: users,
    kbIntegrator: integration,
    logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
  });
  const run = (action: "approve" | "publish" | "reject" | "edit") =>
    tenantService.runWithTenant(
      { tenantId: "ta", source: "authenticated" },
      () =>
        service.reviewFaq({
          faqId: "faq",
          action,
          reviewerId: "reviewer",
          editedAnswer: action === "edit" ? "updated answer" : undefined,
        }),
    );
  beforeEach(() => {
    jest.clearAllMocks();
    faqs.findOne.mockResolvedValue({
      id: "faq",
      tenantId: "ta",
      status: FaqEntryStatus.PENDING_REVIEW,
      answer: "answer",
    });
    users.findOne.mockResolvedValue({
      id: "reviewer",
      tenantId: "ta",
      isActive: true,
      roleEntity: { name: "admin", tenantId: "ta", isActive: true },
    });
  });
  it("locks only active tenant FAQ before writes", async () => {
    await run("approve");
    expect(faqs.findOne).toHaveBeenCalledWith({
      where: { id: "faq", tenantId: "ta", deletedAt: IsNull() },
      lock: { mode: "pessimistic_write" },
    });
  });
  it("rejects foreign or absent FAQ before integration", async () => {
    faqs.findOne.mockResolvedValue(null);
    await expect(run("approve")).rejects.toThrow();
    expect(integration.syncReviewedFaq).not.toHaveBeenCalled();
  });
  it("rejects unprivileged reviewer before mutation", async () => {
    users.findOne.mockResolvedValue({
      id: "reviewer",
      roleEntity: { name: "customer", tenantId: "ta", isActive: true },
    });
    await expect(run("approve")).rejects.toThrow();
    expect(faqs.save).not.toHaveBeenCalled();
  });
  it("cannot publish unapproved generated content", async () => {
    await expect(run("publish")).rejects.toThrow();
    expect(faqs.save).not.toHaveBeenCalled();
  });
  it("approval writes article and FAQ using one manager", async () => {
    const result = await run("approve");
    expect(result.status).toBe("approved");
    expect(integration.syncReviewedFaq).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ status: "approved", reviewedBy: "reviewer" }),
    );
    expect(faqs.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          kbIntegration: { articleId: "article" },
        }),
      }),
    );
  });
  it("article failure prevents FAQ save", async () => {
    integration.syncReviewedFaq.mockRejectedValueOnce(
      new Error("storage failed"),
    );
    await expect(run("approve")).rejects.toThrow("storage failed");
    expect(faqs.save).not.toHaveBeenCalled();
  });
  it("reject revokes mapped article in same transaction", async () => {
    await run("reject");
    expect(integration.revokeMappedArticle).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ tenantId: "ta" }),
    );
    expect(integration.syncReviewedFaq).not.toHaveBeenCalled();
  });
  it("editing published content returns reviewed draft and clears publication time", async () => {
    faqs.findOne.mockResolvedValue({
      id: "faq",
      tenantId: "ta",
      status: "published",
      publishedAt: new Date(),
    });
    expect(await run("edit")).toMatchObject({
      status: "approved",
      publishedAt: null,
      answer: "updated answer",
    });
  });
});
