import { withMembership } from "../../../core/auth/session-identity.fixture";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { TenantModule } from "../../../core/tenant/tenant.module";
import { UsersService } from "../../users/users.service";
import { LearnedFaqController } from "./learned-faq.controller";
import { ReviewManagementController } from "./review-management.controller";
import { LearnedFaqEntry } from "../entities/learned-faq-entry.entity";
import { ReviewQueueService } from "../services/review-queue.service";
import { FeedbackProcessorService } from "../services/feedback-processor.service";
import { FaqEnhancedSearchService } from "../services/faq-enhanced-search.service";
jest.mock("../../users/users.service", () => ({ UsersService: class {} }));
jest.mock("../services/feedback-processor.service", () => ({
  FeedbackProcessorService: class {},
}));
jest.mock("../services/faq-enhanced-search.service", () => ({
  FaqEnhancedSearchService: class {},
}));
jest.mock("../services/review-queue.service", () => ({
  ReviewQueueService: class {},
}));
describe("FAQ actual HTTP boundaries", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const id = "00000000-0000-4000-8000-000000000001";
  const repo = { findOne: jest.fn(async () => null) };
  const search = { search: jest.fn(async () => ({ results: [], total: 0 })) };
  const review = {
    getReviewQueue: jest.fn(async () => ({
      items: [],
      page: 1,
      totalPages: 0,
    })),
    reviewFaq: jest.fn(async () => ({ id, status: "approved" })),
  };
  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "faq-http-local-fixture" }),
      ],
      controllers: [LearnedFaqController, ReviewManagementController],
      providers: [
        { provide: getRepositoryToken(LearnedFaqEntry), useValue: repo },
        { provide: FeedbackProcessorService, useValue: {} },
        { provide: FaqEnhancedSearchService, useValue: search },
        { provide: ReviewQueueService, useValue: review },
        {
          provide: UsersService,
          useValue: {
            findOne: async (role: string) =>
              withMembership({
                id: role,
                tenantId: "ta",
                isActive: true,
                tokenVersion: 1,
                roleNames: [role],
                roles: [{ name: role, permissions: [] }],
                roleEntity: { name: role },
              }),
          },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = mod.get(JwtService);
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());
  const auth = (role: string) =>
    `Bearer ${jwt.sign({ sub: role, type: "access", tokenVersion: 1 })}`;
  it("anonymous cannot read management review queue", () =>
    request(app.getHttpServer()).get("/review/queue").expect(401));
  it.each(["customer", "viewer", "user"])(
    "ordinary %s cannot approve",
    (role) =>
      request(app.getHttpServer())
        .post(`/review/${id}/review`)
        .set("Authorization", auth(role))
        .send({ action: "approve" })
        .expect(403),
  );
  it("verified reviewer can approve with identity from JWT", async () => {
    await request(app.getHttpServer())
      .post(`/review/${id}/review`)
      .set("Authorization", auth("support_agent"))
      .send({ action: "approve" })
      .expect(201);
    expect(review.reviewFaq).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: "support_agent" }),
    );
  });
  it("cannot inject reviewer identity", () =>
    request(app.getHttpServer())
      .post(`/review/${id}/review`)
      .set("Authorization", auth("admin"))
      .send({ action: "approve", reviewerId: id })
      .expect(400));
  it("public search requires explicit validated selector", async () => {
    await request(app.getHttpServer()).get("/faqs/search").expect(403);
    expect(search.search).not.toHaveBeenCalled();
  });
  it("public selector permits published projection search only", async () => {
    await request(app.getHttpServer())
      .get("/faqs/search")
      .set("x-tenant-id", "ta")
      .expect(200);
    expect(search.search).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ tenantId: "ta" }),
      }),
    );
  });
  it("rejects conflicting query tenant", async () => {
    await request(app.getHttpServer())
      .get("/faqs/search?tenantId=tb")
      .set("x-tenant-id", "ta")
      .expect(403);
    expect(search.search).not.toHaveBeenCalled();
  });
  it("public detail scopes tenant and published status", async () => {
    await request(app.getHttpServer())
      .get(`/faqs/${id}`)
      .set("x-tenant-id", "ta")
      .expect(404);
    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id,
          tenantId: "ta",
          status: "published",
        }),
      }),
    );
  });
});
