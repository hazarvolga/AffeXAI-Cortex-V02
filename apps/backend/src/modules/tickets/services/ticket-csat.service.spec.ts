import { withMembership } from "../../../core/auth/session-identity.fixture";
jest.mock("@nestjs/mapped-types", () => ({
  PartialType: require("@nestjs/swagger").PartialType,
}));
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { TicketCSATService } from "./ticket-csat.service";
import { TicketCSATController } from "../controllers/ticket-csat.controller";
import { TicketCSAT } from "../entities/ticket-csat.entity";
import { Ticket } from "../entities/ticket.entity";
import { TicketEmailService } from "./ticket-email.service";
import { TenantModule } from "../../../core/tenant/tenant.module";
import { UsersService } from "../../users/users.service";

const ticketId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const token = "a".repeat(64);
describe("CSAT real HTTP tenant, role and bearer lifecycle", () => {
  let app: INestApplication;
  let jwt: JwtService;
  let service: TicketCSATService;
  let survey: Record<string, any>;
  let ticket: Record<string, any>;
  const qb: Record<string, jest.Mock> = {};
  for (const key of ["leftJoin", "where", "andWhere", "orderBy", "take"])
    qb[key] = jest.fn().mockReturnValue(qb);
  qb.getMany = jest.fn(async () => []);
  qb.getCount = jest.fn(async () => 0);
  qb.clone = jest.fn(() => qb);
  const repo = {
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(async () => []),
    count: jest.fn(async () => 0),
    createQueryBuilder: jest.fn(() => qb),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const transaction = jest.fn(async (callback) =>
    callback({
      getRepository: (entity: unknown) => (entity === Ticket ? tickets : repo),
    }),
  );
  const tickets = { findOne: jest.fn(), manager: { transaction } };
  const email = { sendTicketResolved: jest.fn(async () => undefined) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({
          secret: "isolated-csat-http-secret-at-least32chars",
        }),
      ],
      controllers: [TicketCSATController],
      providers: [
        TicketCSATService,
        { provide: getRepositoryToken(TicketCSAT), useValue: repo },
        { provide: getRepositoryToken(Ticket), useValue: tickets },
        { provide: TicketEmailService, useValue: email },
        {
          provide: UsersService,
          useValue: {
            findOne: async (id) =>
              withMembership({
                id,
                tenantId: "tenant-a",
                isActive: true,
                tokenVersion: 1,
                roleNames: id === "staff" ? ["support"] : ["user"],
              }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = module.get(JwtService);
    service = module.get(TicketCSATService);
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation(async (callback) =>
      callback({
        getRepository: (entity: unknown) =>
          entity === Ticket ? tickets : repo,
      }),
    );
    repo.save.mockImplementation(async (value) => value);
    ticket = {
      id: ticketId,
      tenantId: "tenant-a",
      userId: "customer-a",
      status: "resolved",
      subject: "Safe title",
      description: "private-ticket-secret",
      user: {
        id: "customer-a",
        tenantId: "tenant-a",
        email: "private@example.test",
      },
    };
    survey = {
      id: "survey-id",
      tenantId: "tenant-a",
      ticketId,
      customerId: "customer-a",
      surveyToken: token,
      surveyRequestedAt: new Date(),
      surveyCompletedAt: null,
      rating: 0,
      ticket,
      ipAddress: "private-ip",
      responses: { private: true },
    };
    repo.findOne.mockImplementation(async ({ where }) =>
      where.surveyToken
        ? where.surveyToken === survey.surveyToken
          ? survey
          : null
        : null,
    );
    tickets.findOne.mockImplementation(async ({ where }) =>
      where.id === ticket.id && where.tenantId === ticket.tenantId
        ? ticket
        : null,
    );
    repo.update.mockImplementation(async (_criteria, values) => {
      if (survey.surveyCompletedAt) return { affected: 0 };
      survey = { ...survey, ...values };
      return { affected: 1 };
    });
  });
  const auth = (id = "staff") =>
    jwt.sign({ sub: id, type: "access", tokenVersion: 1 });
  it.each(["statistics", "feedback/recent"])(
    "protects admin GET %s from anonymous and customer",
    async (path) => {
      await request(app.getHttpServer())
        .get(`/tickets/csat/${path}`)
        .expect(401);
      await request(app.getHttpServer())
        .get(`/tickets/csat/${path}`)
        .auth(auth("customer"), { type: "bearer" })
        .expect(403);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
      expect(repo.find).not.toHaveBeenCalled();
    },
  );
  it("protects request from anonymous/customer and foreign tenant staff", async () => {
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .expect(401);
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth("customer"), { type: "bearer" })
      .expect(403);
    ticket = { ...ticket, tenantId: "tenant-b" };
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(404);
    expect(email.sendTicketResolved).not.toHaveBeenCalled();
  });
  it("creates survey for staff using fresh tenant and correct ticket relations without logging token", async () => {
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(201);
    expect(tickets.findOne).toHaveBeenCalledWith({
      where: { id: ticketId, tenantId: "tenant-a" },
      relations: ["user", "assignedTo"],
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-a",
        customerId: "customer-a",
      }),
    );
  });
  it("rejects a corrupt cross-tenant mail recipient relation", async () => {
    ticket.user = { ...ticket.user, tenantId: "tenant-b" };
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(404);
    expect(email.sendTicketResolved).not.toHaveBeenCalled();
  });
  it("serializes concurrent initial issuance through a ticket row lock", async () => {
    let issued: Record<string, unknown> | null = null;
    let queue = Promise.resolve();
    transaction.mockImplementation((callback) => {
      const run = queue.then(() =>
        callback({
          getRepository: (entity: unknown) =>
            entity === Ticket ? tickets : repo,
        }),
      );
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    });
    repo.findOne.mockImplementation(async () => issued);
    repo.save.mockImplementation(async (value) => {
      issued = value;
      return value;
    });
    await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/tickets/csat/${ticketId}/request`)
          .auth(auth(), { type: "bearer" })
          .expect(201),
      ),
    );
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(tickets.findOne).toHaveBeenCalledWith({
      where: { id: ticketId, tenantId: "tenant-a" },
      lock: { mode: "pessimistic_write" },
    });
  });
  it("rejects request for unresolved tickets", async () => {
    ticket = { ...ticket, status: "open" };
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(400);
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("public survey exposes only safe presentation fields", async () => {
    const response = await request(app.getHttpServer())
      .get(`/tickets/csat/survey/${token}`)
      .expect(200);
    expect(response.body.ticket).toEqual({ subject: "Safe title" });
    expect(JSON.stringify(response.body)).not.toMatch(
      /private|surveyToken|customerId|tenantId/,
    );
  });
  it.each(["expired", "missing-date", "foreign-ticket", "wrong-customer"])(
    "rejects invalid bearer relationship: %s",
    async (scenario) => {
      if (scenario === "expired")
        survey.surveyRequestedAt = new Date(Date.now() - 31 * 86400000);
      if (scenario === "missing-date") survey.surveyRequestedAt = null;
      if (scenario === "foreign-ticket") ticket.tenantId = "tenant-b";
      if (scenario === "wrong-customer") ticket.userId = "other";
      await request(app.getHttpServer())
        .get(`/tickets/csat/survey/${token}`)
        .expect(404);
      await request(app.getHttpServer())
        .post(`/tickets/csat/survey/${token}/submit`)
        .send({ rating: 5 })
        .expect(404);
      expect(repo.update).not.toHaveBeenCalled();
    },
  );
  it("rejects malformed token before repository access", async () => {
    await request(app.getHttpServer())
      .get("/tickets/csat/survey/bad")
      .expect(404);
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it.each([
    { rating: 1.5 },
    { rating: "5" },
    { rating: 6 },
    { rating: 0 },
    { rating: 5, customerId: "attacker" },
    { rating: 5, feedback: "x".repeat(4001) },
  ])("validates public body %j", async (body) => {
    await request(app.getHttpServer())
      .post(`/tickets/csat/survey/${token}/submit`)
      .send(body)
      .expect(400);
    expect(repo.update).not.toHaveBeenCalled();
  });
  it("accepts one anonymous response and atomically denies concurrent replay", async () => {
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/tickets/csat/survey/${token}/submit`)
          .send({ rating: 5, feedback: null }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "survey-id",
        tenantId: "tenant-a",
        surveyToken: token,
        surveyCompletedAt: expect.anything(),
        surveyRequestedAt: expect.anything(),
      }),
      expect.objectContaining({ rating: 5 }),
    );
    expect(
      JSON.stringify(responses.find((r) => r.status === 200)?.body),
    ).not.toMatch(/private|surveyToken|customerId/);
  });
  it("retries the same persisted survey after delivery failure without creating another", async () => {
    repo.findOne.mockResolvedValue(survey);
    email.sendTicketResolved.mockRejectedValueOnce(
      new Error("temporary delivery outage"),
    );
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(500);
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(201);
    expect(repo.save).not.toHaveBeenCalled();
    expect(email.sendTicketResolved).toHaveBeenNthCalledWith(2, ticket, token);
  });
  it("does not resend completed or expired surveys", async () => {
    repo.findOne.mockResolvedValue(survey);
    survey.surveyCompletedAt = new Date();
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(400);
    survey.surveyCompletedAt = null;
    survey.surveyRequestedAt = new Date(0);
    await request(app.getHttpServer())
      .post(`/tickets/csat/${ticketId}/request`)
      .auth(auth(), { type: "bearer" })
      .expect(400);
    expect(email.sendTicketResolved).not.toHaveBeenCalled();
  });
  it("validates flat bounded additional responses", async () => {
    await request(app.getHttpServer())
      .post(`/tickets/csat/survey/${token}/submit`)
      .send({ rating: 5, responses: { nested: { secret: true } } })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/tickets/csat/survey/${token}/submit`)
      .send({ rating: 5, responses: { speed: "fast", helpful: true } })
      .expect(200);
  });
  it("applies matching tenant, agent and requested-time cohort to statistics", async () => {
    qb.getMany.mockResolvedValueOnce([{ rating: 5 }, { rating: 1 }]);
    qb.getCount.mockResolvedValueOnce(4);
    const result = await request(app.getHttpServer())
      .get(
        `/tickets/csat/statistics?startDate=2026-01-01&endDate=2026-12-31&agentId=${ticketId}`,
      )
      .auth(auth(), { type: "bearer" })
      .expect(200);
    expect(result.body.responseRate).toBe(50);
    expect(result.body.averageRating).toBe(3);
    expect(qb.andWhere).toHaveBeenCalledWith("csat.tenantId = :tenantId", {
      tenantId: "tenant-a",
    });
    expect(qb.andWhere).toHaveBeenCalledWith("ticket.assignedToId = :agentId", {
      agentId: ticketId,
    });
    expect(qb.clone).toHaveBeenCalled();
    await request(app.getHttpServer())
      .get("/tickets/csat/statistics?startDate=2026-12-31&endDate=2026-01-01")
      .auth(auth(), { type: "bearer" })
      .expect(400);
  });
  it("handles an empty statistics cohort and default recent limit for staff", async () => {
    const result = await request(app.getHttpServer())
      .get("/tickets/csat/statistics")
      .auth(auth(), { type: "bearer" })
      .expect(200);
    expect(result.body).toMatchObject({
      totalResponses: 0,
      averageRating: 0,
      responseRate: 0,
      satisfactionScore: 0,
      promoterScore: 0,
    });
    await request(app.getHttpServer())
      .get("/tickets/csat/feedback/recent")
      .auth(auth(), { type: "bearer" })
      .expect(200);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
  it("permits direct safe optional response defaults and exposes completion without private content", async () => {
    await service.submitSurvey(token, { rating: 4 });
    expect(repo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        feedback: "",
        responses: {},
        ipAddress: "",
        userAgent: "",
      }),
    );
    const response = await request(app.getHttpServer())
      .get(`/tickets/csat/survey/${token}`)
      .expect(200);
    expect(response.body.surveyCompletedAt).toBeTruthy();
    await request(app.getHttpServer())
      .post(`/tickets/csat/survey/${token}/submit`)
      .send({ rating: 2 })
      .expect(400);
  });
  it("requires an explicit tenant for internal staff operations", async () => {
    await expect(service.getStatistics()).rejects.toMatchObject({
      status: 403,
    });
    await expect(service.getRecentFeedback()).rejects.toMatchObject({
      status: 403,
    });
    expect(repo.find).not.toHaveBeenCalled();
  });
  it("scopes recent completed responses and bounds query parameters", async () => {
    await request(app.getHttpServer())
      .get("/tickets/csat/feedback/recent?limit=10")
      .auth(auth(), { type: "bearer" })
      .expect(200);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-a", surveyCompletedAt: expect.anything() },
        take: 10,
      }),
    );
    await request(app.getHttpServer())
      .get("/tickets/csat/feedback/recent?limit=-1")
      .auth(auth(), { type: "bearer" })
      .expect(400);
    await request(app.getHttpServer())
      .get("/tickets/csat/statistics?startDate=garbage")
      .auth(auth(), { type: "bearer" })
      .expect(400);
  });
});
