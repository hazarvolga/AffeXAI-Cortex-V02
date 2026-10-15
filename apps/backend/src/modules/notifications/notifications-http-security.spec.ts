import { withMembership } from "../../core/auth/session-identity.fixture";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { Notification } from "./entities/notification.entity";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { TenantModule } from "../../core/tenant/tenant.module";
jest.mock("../users/users.service", () => ({ UsersService: class {} }));

describe("Notification HTTP ownership", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const secret = "isolated-notification-http-secret";
  const oldSecret = process.env.JWT_SECRET;
  const users = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      tenantId: "ta",
      roleNames: ["viewer"],
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      tenantId: "ta",
      roleNames: ["admin"],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      tenantId: "tb",
      roleNames: ["viewer"],
    },
  ];
  const rows = [
    {
      id: "44444444-4444-4444-8444-444444444444",
      userId: "11111111-1111-4111-8111-111111111111",
      tenantId: "ta",
      message: "private-a",
      isRead: false,
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      userId: "22222222-2222-4222-8222-222222222222",
      tenantId: "tb",
      message: "private-b",
      isRead: false,
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      userId: "33333333-3333-4333-8333-333333333333",
      tenantId: "ta",
      message: "private-admin",
      isRead: false,
    },
  ];
  const matches = (row: object, where: object) =>
    Object.entries(where).every(
      ([key, value]) => row[key as keyof typeof row] === value,
    );
  const repository = {
    find: jest.fn(async ({ where }) =>
      rows.filter((row) => matches(row, where)),
    ),
    findOne: jest.fn(
      async ({ where }) => rows.find((row) => matches(row, where)) ?? null,
    ),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    update: jest.fn(async () => ({ affected: 1 })),
  };
  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    const mod = await Test.createTestingModule({
      imports: [TenantModule, JwtModule.register({ secret })],
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repository },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: async ({ where }) =>
              users.find(
                (user) =>
                  user.id === where.id && user.tenantId === where.tenantId,
              ),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: async (id: string) => {
              const user = users.find((u) => u.id === id);
              return (
                user &&
                withMembership({ ...user, isActive: true, tokenVersion: 1 })
              );
            },
          },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    jwt = mod.get(JwtService);
  });
  afterAll(async () => {
    await app.close();
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });
  beforeEach(() => jest.clearAllMocks());
  it("validates and forwards bounded pagination", async () => {
    await request(app.getHttpServer())
      .get("/notifications?limit=20&offset=40")
      .set("Authorization", auth())
      .expect(200);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20, skip: 40 }),
    );
    for (const query of ["limit=201", "offset=-1", "limit=x", "limit=2.5"])
      await request(app.getHttpServer())
        .get("/notifications?" + query)
        .set("Authorization", auth())
        .expect(400);
  });
  const auth = (id = "11111111-1111-4111-8111-111111111111") =>
    `Bearer ${jwt.sign({ sub: id, type: "access", tokenVersion: 1 })}`;
  it("requires access authentication on reads and writes", async () => {
    for (const path of [
      "/notifications",
      "/notifications/44444444-4444-4444-8444-444444444444",
    ])
      await request(app.getHttpServer()).get(path).expect(401);
    await request(app.getHttpServer())
      .post("/notifications/44444444-4444-4444-8444-444444444444/read")
      .expect(401);
    await request(app.getHttpServer())
      .post("/notifications/read-all")
      .send({ userId: "11111111-1111-4111-8111-111111111111" })
      .expect(401);
  });
  it("lists only current recipient and rejects a forged recipient selector", async () => {
    const response = await request(app.getHttpServer())
      .get("/notifications")
      .set("Authorization", auth())
      .expect(200);
    expect(response.body.map((n: { id: string }) => n.id)).toEqual([
      "44444444-4444-4444-8444-444444444444",
    ]);
    await request(app.getHttpServer())
      .get("/notifications?userId=33333333-3333-4333-8333-333333333333")
      .set("Authorization", auth())
      .expect(403);
  });
  it("cannot read or mark another recipient in either tenant", async () => {
    for (const id of [
      "55555555-5555-4555-8555-555555555555",
      "66666666-6666-4666-8666-666666666666",
    ]) {
      await request(app.getHttpServer())
        .get(`/notifications/${id}`)
        .set("Authorization", auth())
        .expect(404);
      await request(app.getHttpServer())
        .post(`/notifications/${id}/read`)
        .set("Authorization", auth())
        .expect(404);
    }
    expect(repository.save).not.toHaveBeenCalled();
  });
  it("marks only owned notification and recipient-scoped read-all", async () => {
    await request(app.getHttpServer())
      .post("/notifications/44444444-4444-4444-8444-444444444444/read")
      .set("Authorization", auth())
      .expect(201);
    await request(app.getHttpServer())
      .post("/notifications/read-all")
      .set("Authorization", auth())
      .send({ userId: "33333333-3333-4333-8333-333333333333" })
      .expect(403);
    await request(app.getHttpServer())
      .post("/notifications/read-all")
      .set("Authorization", auth())
      .send({})
      .expect(201);
    expect(repository.update).toHaveBeenLastCalledWith(
      { userId: "11111111-1111-4111-8111-111111111111", tenantId: "ta" },
      { isRead: true },
    );
  });
  it("requires admin creation and rejects foreign recipients or tenant hints", async () => {
    const data = {
      message: "hello",
      type: "info",
      userId: "11111111-1111-4111-8111-111111111111",
    };
    await request(app.getHttpServer())
      .post("/notifications/create")
      .set("Authorization", auth())
      .send(data)
      .expect(403);
    await request(app.getHttpServer())
      .post("/notifications/create")
      .set("Authorization", auth("33333333-3333-4333-8333-333333333333"))
      .send({ ...data, userId: "22222222-2222-4222-8222-222222222222" })
      .expect(404);
    await request(app.getHttpServer())
      .post("/notifications/create")
      .set("Authorization", auth("33333333-3333-4333-8333-333333333333"))
      .send({ ...data, tenantId: "tb" })
      .expect(400);
    expect(repository.save).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .post("/notifications/create")
      .set("Authorization", auth("33333333-3333-4333-8333-333333333333"))
      .send(data)
      .expect(201);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "11111111-1111-4111-8111-111111111111",
        tenantId: "ta",
      }),
    );
  });
});
