import { FeedbackProcessorService } from "./feedback-processor.service";
import { TenantService } from "../../../core/tenant/tenant.service";
import { IsNull } from "typeorm";
describe("FAQ feedback respects review revocation", () => {
  const tenants = new TenantService();
  const repo = { findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const manager = { getRepository: () => repo };
  const service = Object.assign(
    Object.create(FeedbackProcessorService.prototype),
    {
      tenantService: tenants,
      faqRepository: {
        ...repo,
        manager: { transaction: async (callback) => callback(manager) },
      },
      logger: { log: jest.fn(), error: jest.fn() },
      analyzeFeedback: async () => ({
        confidenceAdjustment: 0,
        actionRequired: false,
      }),
      processSuggestion: jest.fn(),
    },
  );
  const snapshot = {
    id: "faq",
    tenantId: "ta",
    status: "published",
    answer: "reviewed",
    helpfulCount: 1,
    notHelpfulCount: 0,
    usageCount: 0,
    metadata: { kbIntegration: { articleId: "article" } },
  };
  const run = () =>
    tenants.runWithTenant({ tenantId: "ta", source: "authenticated" }, () =>
      service.processFeedback(
        { faqId: "faq", userId: "actor", feedbackType: "helpful" },
        "ta",
      ),
    );
  beforeEach(() => {
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue({
      ...snapshot,
      metadata: { ...snapshot.metadata },
    });
  });
  it("does not resurrect FAQ rejected during feedback analysis", async () => {
    repo.findOne
      .mockResolvedValueOnce({ ...snapshot })
      .mockResolvedValueOnce(null);
    expect((await run()).processed).toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("rebases counters and preserves latest review mapping", async () => {
    repo.findOne
      .mockResolvedValueOnce({ ...snapshot })
      .mockResolvedValueOnce({
        ...snapshot,
        helpfulCount: 5,
        metadata: {
          kbIntegration: { articleId: "new-article" },
          reviewReason: "new review",
        },
      });
    expect((await run()).processed).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        helpfulCount: 6,
        status: "published",
        metadata: expect.objectContaining({
          kbIntegration: { articleId: "new-article" },
          reviewReason: "new review",
        }),
      }),
    );
    expect(repo.findOne).toHaveBeenLastCalledWith({
      where: {
        id: "faq",
        tenantId: "ta",
        status: "published",
        deletedAt: IsNull(),
      },
      lock: { mode: "pessimistic_write" },
    });
  });
});
