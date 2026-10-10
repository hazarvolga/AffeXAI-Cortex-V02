import { ReviewQueueService } from "./review-queue.service";
import { TenantService } from "../../../core/tenant/tenant.service";
describe("ReviewQueueService scoped list contract", () => {
  const tenants = new TenantService();
  const builder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(async () => [[], 0]),
  };
  const service = Object.assign(Object.create(ReviewQueueService.prototype), {
    tenantService: tenants,
    faqRepository: { createQueryBuilder: () => builder },
    logger: { error: jest.fn() },
  });
  beforeEach(() => jest.clearAllMocks());
  it("requires trusted review context before query", async () => {
    await expect(service.getReviewQueue()).rejects.toThrow();
    expect(builder.getManyAndCount).not.toHaveBeenCalled();
  });
  it("returns current paginated envelope and tenant predicate", async () => {
    const result = await tenants.runWithTenant(
      { tenantId: "ta", source: "authenticated" },
      () => service.getReviewQueue({ page: 2, limit: 10 }),
    );
    expect(result).toMatchObject({
      items: [],
      total: 0,
      page: 2,
      limit: 10,
      hasPrev: true,
    });
    expect(builder.where).toHaveBeenCalledWith("faq.tenantId = :tenantId", {
      tenantId: "ta",
    });
    expect(builder.skip).toHaveBeenCalledWith(10);
  });
  it("binds search text and escapes wildcard operators", async () => {
    await tenants.runWithTenant(
      { tenantId: "ta", source: "authenticated" },
      () => service.getReviewQueue({ search: "O'Reilly_%" }),
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      "(faq.question ILIKE :search OR faq.answer ILIKE :search)",
      { search: "%O'Reilly\\_\\%%" },
    );
  });
  // Mutation/transition cases live in faq-review-transaction.spec + actual PostgreSQL harness.
});
