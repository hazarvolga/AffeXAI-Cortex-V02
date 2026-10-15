import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CmsMetricsService } from "./cms-metrics.service";
import { CmsMetric, MetricType } from "../entities/cms-metric.entity";
import { TenantService } from "../../../core/tenant/tenant.service";

describe("CmsMetricsService", () => {
  let service: CmsMetricsService;
  let repo: Repository<CmsMetric>;

  // One shared builder, so a test can stub what every query in a call resolves to.
  const builder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((d) => d),
    save: jest
      .fn()
      .mockImplementation((d) => Promise.resolve({ id: "1", ...d })),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(() => builder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmsMetricsService,
        { provide: TenantService, useValue: { getTenantId: () => "tenant-1" } },
        { provide: getRepositoryToken(CmsMetric), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CmsMetricsService>(CmsMetricsService);
    repo = module.get(getRepositoryToken(CmsMetric));
  });

  describe("trackPageView", () => {
    it("should save view metric", async () => {
      await service.trackPageView({
        pageId: "p1",
        pageTitle: "T",
        visitorId: "v1",
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: MetricType.VIEW,
          visitorId: "v1",
        }),
      );
    });
  });

  describe("getTopPages", () => {
    it("should aggregate views", async () => {
      const mockRaw = [
        {
          page_id: "p1",
          page_title: "Title",
          view_count: "10",
          unique_visitors: "5",
        },
      ];

      builder.getRawMany.mockResolvedValue(mockRaw as never);

      // Access private method via any or test via public getMetrics
      // But getMetrics calls it.

      const metrics = await service.getMetrics("day");
      expect(metrics.topPages[0].viewCount).toBe(10);
      expect(metrics.topPages[0].pageId).toBe("p1");
      expect(builder.andWhere).toHaveBeenCalledWith(
        "metric.tenantId = :tenantId",
        { tenantId: "tenant-1" },
      );
    });
  });

  describe("getMetrics", () => {
    it("should return combined stats", async () => {
      mockRepo.find.mockResolvedValue([
        { metricType: MetricType.VIEW, visitorId: "v1" },
        { metricType: MetricType.CLICK, linkUrl: "http" },
      ]);

      const result = await service.getMetrics("week");

      expect(result.summary.totalViews).toBe(1);
      expect(result.summary.totalClicks).toBe(1);
    });
  });
});
