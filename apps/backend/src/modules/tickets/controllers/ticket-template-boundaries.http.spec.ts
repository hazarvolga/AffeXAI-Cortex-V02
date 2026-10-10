import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { TicketTemplatesController } from "./ticket-templates.controller";
import { TicketTemplatesService } from "../services/ticket-templates.service";
import { TicketTemplate } from "../entities/ticket-template.entity";
import { TenantModule } from "../../../core/tenant/tenant.module";
import { UsersService } from "../../users/users.service";
import { ResponseInterceptor } from "../../../common/interceptors/response.interceptor";
describe("template private data HTTP boundary with production response stack", () => {
  let app: INestApplication, jwt: JwtService;
  const owner = randomUUID(),
    other = randomUUID(),
    editor = randomUUID(),
    foreign = randomUUID();
  const privateId = randomUUID(),
    publicId = randomUUID();
  const rows = [
    {
      id: privateId,
      tenantId: "tenant-a",
      createdById: owner,
      isActive: true,
      isPublic: false,
      name: "Private",
    },
    {
      id: publicId,
      tenantId: "tenant-a",
      createdById: owner,
      isActive: true,
      isPublic: true,
      name: "Public",
      createdBy: {
        id: owner,
        firstName: "Ada",
        email: "private@example.test",
        phone: "private",
      },
    },
  ];
  const matches = (row, where) =>
    Object.entries(where).every(([key, value]) =>
      typeof value === "object" ? true : row[key] === value,
    );
  const repo = {
    findOne: jest.fn(
      async ({ where }) => rows.find((row) => matches(row, where)) || null,
    ),
    find: jest.fn(async ({ where }) =>
      rows.filter((row) =>
        (Array.isArray(where) ? where : [where]).some((clause) =>
          matches(row, clause),
        ),
      ),
    ),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "local-template-boundary-fixture-only" }),
      ],
      controllers: [TicketTemplatesController],
      providers: [
        TicketTemplatesService,
        { provide: getRepositoryToken(TicketTemplate), useValue: repo },
        {
          provide: UsersService,
          useValue: {
            findOne: async (id) => ({
              id,
              tenantId: id === foreign ? "tenant-b" : "tenant-a",
              isActive: true,
              tokenVersion: 1,
              roles: [],
              roleNames: [
                id === owner || id === editor ? "editor" : "customer",
              ],
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
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    jwt = module.get(JwtService);
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());
  const token = (id) => jwt.sign({ sub: id, type: "access", tokenVersion: 1 });
  it("anonymous cannot list templates", async () => {
    await request(app.getHttpServer()).get("/tickets/templates").expect(401);
    expect(repo.find).not.toHaveBeenCalled();
  });
  it("customer list contains public but no other private record", async () => {
    const response = await request(app.getHttpServer())
      .get("/tickets/templates")
      .auth(token(other), { type: "bearer" })
      .expect(200);
    expect(response.body.data.map((row) => row.id)).toEqual([publicId]);
    expect(response.body.data[0].createdBy.email).toBeUndefined();
  });
  it("explicit private filter still cannot enumerate another owner", async () => {
    const response = await request(app.getHttpServer())
      .get("/tickets/templates?isPublic=false")
      .auth(token(other), { type: "bearer" })
      .expect(200);
    expect(response.body.data).toEqual([]);
  });
  it.each([other, editor, foreign])(
    "other actor cannot read private detail",
    async (id) => {
      await request(app.getHttpServer())
        .get(`/tickets/templates/${privateId}`)
        .auth(token(id), { type: "bearer" })
        .expect(404);
    },
  );
  it("owner can read private template", async () => {
    await request(app.getHttpServer())
      .get(`/tickets/templates/${privateId}`)
      .auth(token(owner), { type: "bearer" })
      .expect(200);
  });
  it("search cannot expose other private templates", async () => {
    const response = await request(app.getHttpServer())
      .get("/tickets/templates/search?q=private")
      .auth(token(other), { type: "bearer" })
      .expect(200);
    expect(response.body.data.map((row) => row.id)).not.toContain(privateId);
  });
  it("customer cannot use another private template", async () => {
    await request(app.getHttpServer())
      .post(`/tickets/templates/${privateId}/use`)
      .auth(token(other), { type: "bearer" })
      .expect(404);
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });
  it("other editor cannot mutate private template", async () => {
    await request(app.getHttpServer())
      .patch(`/tickets/templates/${privateId}`)
      .auth(token(editor), { type: "bearer" })
      .send({ name: "Overwrite" })
      .expect(404);
    expect(repo.update).not.toHaveBeenCalled();
  });
  it("customer cannot create and forged owner fields are rejected for editor", async () => {
    await request(app.getHttpServer())
      .post("/tickets/templates")
      .auth(token(other), { type: "bearer" })
      .send({ name: "New", subject: "Subject", content: "Body" })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/tickets/templates/${privateId}`)
      .auth(token(owner), { type: "bearer" })
      .send({ createdById: other })
      .expect(400);
  });
});
