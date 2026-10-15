import { withMembership } from "../../../core/auth/session-identity.fixture";
jest.mock("@nestjs/mapped-types", () => ({
  PartialType: require("@nestjs/swagger").PartialType,
}));
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import request from "supertest";
import { TenantModule } from "../../../core/tenant/tenant.module";
import { UsersService } from "../../users/users.service";
import { GeneralCommunicationController } from "./general-communication.controller";
import { UrlProcessingController } from "./url-processing.controller";
import { GeneralCommunicationAiService } from "../services/general-communication-ai.service";
import { GeneralCommunicationContextService } from "../services/general-communication-context.service";
import { ChatSessionService } from "../services/chat-session.service";
import { ChatMessageService } from "../services/chat-message.service";
import { ChatEscalationService } from "../services/chat-escalation.service";
import { UrlProcessorService } from "../services/url-processor.service";
import { UrlCacheService } from "../services/url-cache.service";
const sessionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
describe("general communication and URL cache HTTP authorization", () => {
  let app: INestApplication;
  let jwt: JwtService;
  let session = {
    id: sessionId,
    tenantId: "tenant-a",
    userId: "owner",
    sessionType: "general",
    messageCount: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const downstream = jest.fn(async () => ({ content: "hello", success: true }));
  const createSession = jest.fn(async (value) => ({ ...session, ...value }));
  const cache = {
    getCachedUrl: downstream,
    getCacheEntries: downstream,
    getCacheMetrics: downstream,
    cleanupCache: downstream,
    removeCacheByUrl: downstream,
    getCacheByDomain: downstream,
    preloadUrls: downstream,
    resetMetrics: downstream,
    bulkUpdateStatus: downstream,
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "isolated-general-chat-http-secret" }),
      ],
      controllers: [GeneralCommunicationController, UrlProcessingController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findOne: async (id: string) =>
              withMembership({
                id,
                tenantId: "tenant-a",
                isActive: true,
                tokenVersion: 1,
                roleNames: id === "staff" ? ["support"] : ["user"],
              }),
          },
        },
        {
          provide: GeneralCommunicationAiService,
          useValue: {
            generateGeneralResponse: downstream,
            getConversationStarters: downstream,
          },
        },
        {
          provide: GeneralCommunicationContextService,
          useValue: {
            buildGeneralContext: downstream,
            getSuggestedTopics: downstream,
            isPlatformInformationQuery: downstream,
            chatContextEngineService: { getContextStatistics: downstream },
          },
        },
        {
          provide: ChatSessionService,
          useValue: {
            getSession: async () => session,
            validateSessionAccess: async () => true,
            createSession,
          },
        },
        { provide: ChatMessageService, useValue: {} },
        {
          provide: ChatEscalationService,
          useValue: {
            escalateToSupport: downstream,
            analyzeEscalationNeed: downstream,
            getSessionEscalationHistory: downstream,
            getEscalationStatistics: downstream,
          },
        },
        { provide: UrlProcessorService, useValue: { processUrl: downstream } },
        { provide: UrlCacheService, useValue: cache },
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
  });
  beforeEach(() => {
    jest.clearAllMocks();
    session = { ...session, tenantId: "tenant-a", userId: "owner" };
  });
  afterAll(async () => app.close());
  const token = (sub = "viewer") =>
    jwt.sign({ sub, type: "access", tokenVersion: 1 });
  it.each([
    "/chat/general/suggested-topics",
    "/chat/general/conversation-starters",
    `/chat/general/sessions/${sessionId}/stats`,
  ])("requires authentication for %s", async (path) => {
    await request(app.getHttpServer()).get(path).expect(401);
    expect(downstream).not.toHaveBeenCalled();
  });
  it.each([
    "query",
    "context",
    `sessions/${sessionId}/escalate`,
    `sessions/${sessionId}/analyze-escalation`,
  ])("denies other owner before %s downstream execution", async (path) => {
    await request(app.getHttpServer())
      .post(`/chat/general/${path}`)
      .auth(token(), { type: "bearer" })
      .send({ query: "hello", sessionId })
      .expect(403);
    expect(downstream).not.toHaveBeenCalled();
  });
  it("denies foreign tenant session even to staff", async () => {
    session = { ...session, tenantId: "tenant-b" };
    await request(app.getHttpServer())
      .get(`/chat/general/sessions/${sessionId}/escalation-history`)
      .auth(token("staff"), { type: "bearer" })
      .expect(403);
    expect(downstream).not.toHaveBeenCalled();
  });
  it("allows owner query and uses fresh identity when creating sessions", async () => {
    await request(app.getHttpServer())
      .post("/chat/general/query")
      .auth(token("owner"), { type: "bearer" })
      .send({ query: "hello", sessionId })
      .expect(201);
    await request(app.getHttpServer())
      .post("/chat/general/sessions")
      .auth(token("owner"), { type: "bearer" })
      .send({ title: "Hello" })
      .expect(201);
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "owner" }),
    );
  });
  it.each([
    "cache",
    "cache/hash",
    "cache/domain/example.test",
    "cache/metrics",
  ])("denies ordinary user URL cache %s", async (path) => {
    await request(app.getHttpServer())
      .get(`/chat/urls/${path}`)
      .auth(token(), { type: "bearer" })
      .expect(403);
    expect(downstream).not.toHaveBeenCalled();
  });
  it.each([
    "process",
    "process/batch",
    "cache/cleanup",
    "cache/preload",
    "cache/bulk-update",
    "cache/metrics/reset",
  ])("denies ordinary user URL action %s", async (path) => {
    await request(app.getHttpServer())
      .post(`/chat/urls/${path}`)
      .auth(token(), { type: "bearer" })
      .send({ url: "https://example.test", urls: ["https://example.test"] })
      .expect(403);
    expect(downstream).not.toHaveBeenCalled();
  });
  it("denies ordinary user cache delete and aggregate escalation statistics", async () => {
    await request(app.getHttpServer())
      .delete("/chat/urls/cache")
      .auth(token(), { type: "bearer" })
      .send({ url: "https://example.test" })
      .expect(403);
    await request(app.getHttpServer())
      .get("/chat/general/escalation-statistics")
      .auth(token(), { type: "bearer" })
      .expect(403);
  });
  it("allows staff cache administration but denies global metrics reset", async () => {
    await request(app.getHttpServer())
      .get("/chat/urls/cache")
      .auth(token("staff"), { type: "bearer" })
      .expect(200);
    await request(app.getHttpServer())
      .post("/chat/urls/cache/metrics/reset")
      .auth(token("staff"), { type: "bearer" })
      .expect(403);
  });
  it("returns actual tracked count for own session and denies other user stats", async () => {
    const response = await request(app.getHttpServer())
      .get(`/chat/general/sessions/${sessionId}/stats`)
      .auth(token("owner"), { type: "bearer" })
      .expect(200);
    expect(response.body.messageCount).toBe(7);
    await request(app.getHttpServer())
      .get(`/chat/general/sessions/${sessionId}/stats`)
      .auth(token(), { type: "bearer" })
      .expect(403);
  });
  it("staff can assist a same-tenant session and view tenant escalation statistics", async () => {
    await request(app.getHttpServer())
      .post("/chat/general/context")
      .auth(token("staff"), { type: "bearer" })
      .send({ query: "hello", sessionId })
      .expect(201);
    await request(app.getHttpServer())
      .get("/chat/general/escalation-statistics")
      .auth(token("staff"), { type: "bearer" })
      .expect(200);
  });
  it("static metrics path cannot bypass platform restriction via dynamic hash route", async () => {
    await request(app.getHttpServer())
      .get("/chat/urls/cache/metrics")
      .auth(token("staff"), { type: "bearer" })
      .expect(403);
    expect(downstream).not.toHaveBeenCalled();
  });

  it("accepts valid URL DTOs through the production validation pipe for staff", async () => {
    await request(app.getHttpServer())
      .post("/chat/urls/process")
      .auth(token("staff"), { type: "bearer" })
      .send({ url: "https://example.com", forceRefresh: false })
      .expect(201);
    await request(app.getHttpServer())
      .post("/chat/urls/process/batch")
      .auth(token("staff"), { type: "bearer" })
      .send({ urls: ["https://example.com"], forceRefresh: true })
      .expect(201);
    expect(downstream).toHaveBeenCalledTimes(2);
  });
  it.each([
    { url: "file:///etc/passwd" },
    { url: "https://example.com", tenantId: "tenant-b" },
    { url: "https://example.com", forceRefresh: "yes" },
  ])("rejects malformed URL DTO %j before fetch", async (data) => {
    await request(app.getHttpServer())
      .post("/chat/urls/process")
      .auth(token("staff"), { type: "bearer" })
      .send(data)
      .expect(400);
    expect(downstream).not.toHaveBeenCalled();
  });
  it("rejects invalid query fields and bounds suggested-topic query conversion", async () => {
    await request(app.getHttpServer())
      .post("/chat/general/query")
      .auth(token("owner"), { type: "bearer" })
      .send({ query: "hello", sessionId, maxResponseLength: 999999 })
      .expect(400);
    await request(app.getHttpServer())
      .get("/chat/general/suggested-topics?limit=5")
      .auth(token("owner"), { type: "bearer" })
      .expect(200);
    expect(downstream).toHaveBeenCalledWith(5);
    await request(app.getHttpServer())
      .get("/chat/general/suggested-topics?limit=999")
      .auth(token("owner"), { type: "bearer" })
      .expect(400);
  });
});
