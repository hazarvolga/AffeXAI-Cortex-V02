import { withMembership } from "../../../core/auth/session-identity.fixture";
import { ResponseInterceptor } from "../../../common/interceptors/response.interceptor";
import { Reflector } from "@nestjs/core";
import { ClassSerializerInterceptor, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import request from "supertest";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { TicketAttachmentsController } from "./ticket-attachments.controller";
import { TicketAttachmentService } from "../services/ticket-attachment.service";
import { TicketAttachmentEntity } from "../entities/ticket-attachment.entity";
import { Ticket } from "../entities/ticket.entity";
import { TicketMessage } from "../entities/ticket-message.entity";
import { TenantModule } from "../../../core/tenant/tenant.module";
import { UsersService } from "../../users/users.service";

describe("authenticated private attachment HTTP roundtrip", () => {
  let app: INestApplication, jwt: JwtService, root: string;
  const owner = randomUUID(),
    other = randomUUID(),
    foreign = randomUUID();
  const records = new Map();
  const repo = {
    create: jest.fn((value) => ({
      ...value,
      id: randomUUID(),
      createdAt: new Date(),
    })),
    save: jest.fn(async (value) => {
      records.set(value.id, value);
      return value;
    }),
    findOne: jest.fn(async ({ where }) => {
      const row = records.get(where.id);
      return row?.tenantId === where.tenantId ? row : null;
    }),
  };
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "affexai-attachment-http-"));
    const mod = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "local-private-attachment-fixture-key" }),
      ],
      controllers: [TicketAttachmentsController],
      providers: [
        TicketAttachmentService,
        { provide: getRepositoryToken(TicketAttachmentEntity), useValue: repo },
        { provide: getRepositoryToken(Ticket), useValue: {} },
        { provide: getRepositoryToken(TicketMessage), useValue: {} },
        { provide: ConfigService, useValue: { get: () => root } },
        {
          provide: UsersService,
          useValue: {
            findOne: async (id) =>
              withMembership({
                id,
                tenantId: id === foreign ? "tenant-b" : "tenant-a",
                isActive: true,
                tokenVersion: 1,
                roles: [],
                roleNames: ["customer"],
              }),
          },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    jwt = mod.get(JwtService);
  });
  afterAll(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });
  const token = (id) => jwt.sign({ sub: id, type: "access", tokenVersion: 1 });
  it("requires auth before upload", async () => {
    await request(app.getHttpServer())
      .post("/tickets/attachments/upload")
      .attach("file", Buffer.from("private"), "fixture.txt")
      .expect(401);
  });
  it("uploads real bytes, downloads exact bytes only as owner, with safe headers", async () => {
    const bytes = Buffer.from("Private ticket attachment roundtrip");
    const upload = await request(app.getHttpServer())
      .post("/tickets/attachments/upload")
      .auth(token(owner), { type: "bearer" })
      .attach("file", bytes, "fixture.txt")
      .expect(201);
    const path = `/tickets/attachments/${upload.body.data.id}/download`;
    const result = await request(app.getHttpServer())
      .get(path)
      .auth(token(owner), { type: "bearer" })
      .expect(200);
    expect(result.body).toEqual(bytes);
    expect(result.headers["content-disposition"]).toMatch(/^attachment;/);
    expect(result.headers["x-content-type-options"]).toBe("nosniff");
    expect(result.headers["cache-control"]).toBe("private, no-store");
    await request(app.getHttpServer()).get(path).expect(401);
    await request(app.getHttpServer())
      .get(path)
      .auth(token(other), { type: "bearer" })
      .expect(403);
    await request(app.getHttpServer())
      .get(path)
      .auth(token(foreign), { type: "bearer" })
      .expect(404);
  });
  it("rejects oversized multipart before storage", async () => {
    const before = (await readdir(root)).length;
    await request(app.getHttpServer())
      .post("/tickets/attachments/upload")
      .auth(token(owner), { type: "bearer" })
      .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1, 65), "large.txt")
      .expect(413);
    expect((await readdir(root)).length).toBe(before);
  });
  it("rejects spoofed extension/signature before persistence", async () => {
    const before = repo.save.mock.calls.length;
    await request(app.getHttpServer())
      .post("/tickets/attachments/upload")
      .auth(token(owner), { type: "bearer" })
      .attach("file", Buffer.from("Not a PDF"), {
        filename: "fake.pdf",
        contentType: "application/pdf",
      })
      .expect(400);
    expect(repo.save.mock.calls.length).toBe(before);
  });
  it("rejects invalid download identifier", async () => {
    await request(app.getHttpServer())
      .get("/tickets/attachments/not-uuid/download")
      .auth(token(owner), { type: "bearer" })
      .expect(400);
  });
});
