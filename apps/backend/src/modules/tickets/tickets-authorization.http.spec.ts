import { withMembership } from "../../core/auth/session-identity.fixture";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import request from "supertest";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { TicketEmailParserService } from "./services/ticket-email-parser.service";
import { EmailWebhookAdapterFactory } from "./services/email-webhook-adapter-factory.service";
import { UsersService } from "../users/users.service";
import { TenantModule } from "../../core/tenant/tenant.module";
jest.mock("./tickets.service", () => ({ TicketsService: class {} }));
jest.mock("./services/ticket-email-parser.service", () => ({
  TicketEmailParserService: class {},
}));
jest.mock("./services/email-webhook-adapter-factory.service", () => ({
  EmailWebhookAdapterFactory: class {},
  PROVIDER_AUTO: "auto",
}));
jest.mock("../users/users.service", () => ({ UsersService: class {} }));

describe("Ticket HTTP actor and provider boundaries", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const service = {
    findAll: jest.fn(async () => []),
    findOne: jest.fn(),
    create: jest.fn(async () => ({ id: "created" })),
    addMessage: jest.fn(async () => ({ id: "message" })),
    updateStatus: jest.fn(async () => ({})),
    getTicketSignal: jest.fn(async () => ({})),
    analyzeTicketWithAI: jest.fn(async () => ({})),
  };
  const parser = { processInboundEmail: jest.fn() };
  const adapters = { getAdapter: jest.fn() };
  const valid = {
    subject: "Test ticket subject",
    description: "A sufficiently detailed issue for support.",
  };
  const roles = [
    "admin",
    "editor",
    "support",
    "support_manager",
    "support_agent",
  ];
  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "isolated-ticket-http-fixture" }),
      ],
      controllers: [TicketsController],
      providers: [
        { provide: TicketsService, useValue: service },
        { provide: TicketEmailParserService, useValue: parser },
        { provide: EmailWebhookAdapterFactory, useValue: adapters },
        {
          provide: UsersService,
          useValue: {
            findOne: async (id: string) =>
              withMembership({
                id,
                tenantId: "tenant-a",
                isActive: true,
                tokenVersion: 1,
                roles: [{ name: id, permissions: [] }],
                roleEntity: { name: id },
                roleNames: [id],
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
  beforeEach(() => {
    jest.clearAllMocks();
    service.findOne.mockResolvedValue({
      id: "ticket",
      userId: "owner",
      tenantId: "tenant-a",
    });
  });
  const auth = (id = "owner") =>
    `Bearer ${jwt.sign({ sub: id, type: "access", tokenVersion: 1 })}`;
  it.each(["customer", "viewer", "user", "student", "owner"])(
    "scopes %s list to own identity despite forged filter",
    async (role) => {
      await request(app.getHttpServer())
        .get("/tickets?userId=00000000-0000-4000-8000-000000000001")
        .set("Authorization", auth(role))
        .expect(200);
      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ userId: role }),
      );
    },
  );
  it.each(["get", "message", "context", "status"])(
    "denies foreign ticket %s before protected operation",
    async (action) => {
      const client = request(app.getHttpServer());
      const call =
        action === "get"
          ? client.get("/tickets/ticket")
          : action === "context"
            ? client.get("/tickets/ticket/neural-context")
            : action === "status"
              ? client
                  .patch("/tickets/ticket/status")
                  .send({ status: "resolved" })
              : client
                  .post("/tickets/ticket/messages")
                  .send({ content: "A valid support message" });
      await call.set("Authorization", auth("customer")).expect(403);
      expect(service.addMessage).not.toHaveBeenCalled();
      expect(service.getTicketSignal).not.toHaveBeenCalled();
      expect(service.updateStatus).not.toHaveBeenCalled();
    },
  );
  it.each(["viewer", "user", "student"])(
    "denies noncustomer %s reading others",
    async (role) => {
      await request(app.getHttpServer())
        .get("/tickets/ticket")
        .set("Authorization", auth(role))
        .expect(403);
    },
  );
  it.each(roles)(
    "permits trusted %s staff read and status transition",
    async (role) => {
      await request(app.getHttpServer())
        .get("/tickets/ticket")
        .set("Authorization", auth(role))
        .expect(200);
      await request(app.getHttpServer())
        .patch("/tickets/ticket/status")
        .set("Authorization", auth(role))
        .send({ status: "open" })
        .expect(200);
    },
  );
  it.each([
    ["not-a-uuid"],
    Array(11).fill("00000000-0000-4000-8000-000000000001"),
    [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000001",
    ],
  ])(
    "rejects invalid attachment IDs %p before creation or reply",
    async (...attachmentIds) => {
      await request(app.getHttpServer())
        .post("/tickets")
        .set("Authorization", auth())
        .send({ ...valid, attachmentIds })
        .expect(400);
      await request(app.getHttpServer())
        .post("/tickets/ticket/messages")
        .set("Authorization", auth())
        .send({ content: "A valid message", attachmentIds })
        .expect(400);
      expect(service.create).not.toHaveBeenCalled();
      expect(service.addMessage).not.toHaveBeenCalled();
    },
  );
  it("denies owner access to tenant-wide neural memory until retrieval ACL exists", async () => {
    await request(app.getHttpServer())
      .get("/tickets/ticket/neural-context")
      .set("Authorization", auth())
      .expect(403);
    expect(service.getTicketSignal).not.toHaveBeenCalled();
  });
  it("permits ordinary owner to create, read, reply and resolve", async () => {
    await request(app.getHttpServer())
      .post("/tickets")
      .set("Authorization", auth())
      .send(valid)
      .expect(201);
    await request(app.getHttpServer())
      .get("/tickets/ticket")
      .set("Authorization", auth())
      .expect(200);
    await request(app.getHttpServer())
      .post("/tickets/ticket/messages")
      .set("Authorization", auth())
      .send({ content: "A valid support message" })
      .expect(201);
    await request(app.getHttpServer())
      .patch("/tickets/ticket/status")
      .set("Authorization", auth())
      .send({ status: "resolved" })
      .expect(200);
  });
  it("denies ordinary owner staff-only status and internal note", async () => {
    await request(app.getHttpServer())
      .patch("/tickets/ticket/status")
      .set("Authorization", auth())
      .send({ status: "open" })
      .expect(403);
    await request(app.getHttpServer())
      .post("/tickets/ticket/messages")
      .set("Authorization", auth())
      .send({ content: "A valid support message", isInternal: true })
      .expect(403);
  });
  it.each(["/tickets", "/tickets/public", "/tickets/analyze"])(
    "rejects anonymous %s before provider or persistence",
    async (path) => {
      await request(app.getHttpServer())
        .post(path)
        .send({
          ...valid,
          userId: "owner",
          title: "title",
          problemDescription: "description",
          category: "general",
        })
        .expect(401);
      expect(service.create).not.toHaveBeenCalled();
      expect(service.analyzeTicketWithAI).not.toHaveBeenCalled();
    },
  );
  it("retains authenticated legacy creation alias with own identity and rejects supplied actor", async () => {
    await request(app.getHttpServer())
      .post("/tickets/public")
      .set("Authorization", auth())
      .send(valid)
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      "owner",
      expect.objectContaining(valid),
    );
    await request(app.getHttpServer())
      .post("/tickets/public")
      .set("Authorization", auth())
      .send({ ...valid, userId: "foreign" })
      .expect(400);
  });
  it("validates bounded creation and analysis DTOs before work", async () => {
    await request(app.getHttpServer())
      .post("/tickets")
      .set("Authorization", auth())
      .send({ ...valid, description: "x".repeat(20001) })
      .expect(400);
    await request(app.getHttpServer())
      .post("/tickets/analyze")
      .set("Authorization", auth())
      .send({
        title: "Valid title",
        problemDescription: "x".repeat(20001),
        category: "general",
      })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.analyzeTicketWithAI).not.toHaveBeenCalled();
  });
  it("allows validated authenticated AI analysis", async () => {
    await request(app.getHttpServer())
      .post("/tickets/analyze")
      .set("Authorization", auth())
      .send({
        title: "Valid title",
        problemDescription: "A sufficiently detailed issue for analysis.",
        category: "general",
      })
      .expect(201);
    expect(service.analyzeTicketWithAI).toHaveBeenCalled();
  });
  it("redacts internal notes from owner detail and status responses while staff retains them", async () => {
    const ticket = {
      id: "ticket",
      userId: "owner",
      messages: [
        { id: "public", isInternal: false },
        { id: "private", isInternal: true, content: "staff secret" },
      ],
    };
    service.findOne.mockResolvedValue(ticket);
    service.updateStatus.mockResolvedValue(ticket);
    for (const action of ["get", "status"]) {
      const client = request(app.getHttpServer());
      const call =
        action === "get"
          ? client.get("/tickets/ticket")
          : client.patch("/tickets/ticket/status").send({ status: "resolved" });
      const res = await call.set("Authorization", auth()).expect(200);
      expect(JSON.stringify(res.body)).not.toContain("staff secret");
    }
    const staff = await request(app.getHttpServer())
      .get("/tickets/ticket")
      .set("Authorization", auth("admin"))
      .expect(200);
    expect(staff.body.messages).toHaveLength(2);
  });
  it.each([false, true])(
    "fails closed on inbound email, authenticated=%s",
    async (signed) => {
      let call = request(app.getHttpServer())
        .post("/tickets/inbound-email")
        .send({ from: "victim@example.test", to: "ticket@example.test" });
      if (signed) call = call.set("Authorization", auth("admin"));
      await call.expect(503);
      expect(adapters.getAdapter).not.toHaveBeenCalled();
      expect(parser.processInboundEmail).not.toHaveBeenCalled();
    },
  );
});
