import { FeedbackProcessorService } from "./feedback-processor.service";
import { LearnedFaqEntry } from "../entities/learned-faq-entry.entity";
import { TenantService } from "../../../core/tenant/tenant.service";
describe("FeedbackProcessorService current counter contract", () => {
  const tenants = new TenantService();
  const repo = { findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const service = Object.assign(
    Object.create(FeedbackProcessorService.prototype),
    {
      tenantService: tenants,
      faqRepository: {
        ...repo,
        manager: {
          transaction: async (callback) =>
            callback({ getRepository: () => repo }),
        },
      },
      confidenceCalculator: {
        adjustConfidenceBasedOnFeedback: async (value) => value,
      },
      logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
    },
  );
  beforeEach(() => {
    jest.clearAllMocks();
    repo.findOne.mockImplementation(async () =>
      Object.assign(new LearnedFaqEntry(), {
        id: "faq",
        tenantId: "fixture",
        answer: "Answer",
        question: "Question",
        status: "published",
        confidence: 80,
        helpfulCount: 2,
        notHelpfulCount: 1,
        usageCount: 3,
        metadata: {},
      }),
    );
  });
  it.each(["helpful", "not_helpful"] as const)(
    "records %s with scoped fresh counters",
    async (feedbackType) => {
      const result = await tenants.runWithTenant(
        { tenantId: "fixture", source: "authenticated" },
        () =>
          service.processFeedback(
            { faqId: "faq", feedbackType, userId: "user" },
            "fixture",
          ),
      );
      expect(result.processed).toBe(true);
      expect(result.updatedFaq).toMatchObject({
        helpfulCount: feedbackType === "helpful" ? 3 : 2,
        notHelpfulCount: feedbackType === "not_helpful" ? 2 : 1,
        usageCount: 4,
        status: "published",
      });
    },
  );
  it("rejects implicit tenant before reading", async () => {
    expect(
      (
        await service.processFeedback(
          { faqId: "faq", feedbackType: "helpful" },
          "fixture",
        )
      ).processed,
    ).toBe(false);
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it("preserves published answer when only feedback is recorded", async () => {
    const result = await tenants.runWithTenant(
      { tenantId: "fixture", source: "authenticated" },
      () =>
        service.processFeedback(
          { faqId: "faq", feedbackType: "helpful" },
          "fixture",
        ),
    );
    expect(result.updatedFaq?.answer).toBe("Answer");
    expect(result.updatedFaq?.metadata).toHaveProperty("feedbackHistory");
  });
});
