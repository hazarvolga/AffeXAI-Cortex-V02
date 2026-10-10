import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { KnowledgeBaseController } from "./knowledge-base.controller";
import { KnowledgeBaseService } from "../services/knowledge-base.service";
import { TenantModule } from "../../../core/tenant/tenant.module";
import { UsersService } from "../../users/users.service";

describe("knowledge base draft administration HTTP boundary", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const editor = randomUUID(),
    customer = randomUUID();
  const service = {
    searchArticles: jest.fn().mockResolvedValue({ articles: [], total: 0 }),
    getArticle: jest.fn().mockResolvedValue({ id: "fixture", status: "draft" }),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "local-kb-admin-fixture-only" }),
      ],
      controllers: [KnowledgeBaseController],
      providers: [
        { provide: KnowledgeBaseService, useValue: service },
        {
          provide: UsersService,
          useValue: {
            findOne: async (id) => ({
              id,
              tenantId: "tenant-a",
              isActive: true,
              tokenVersion: 1,
              roles: [],
              roleNames: [id === editor ? "editor" : "customer"],
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    jwt = module.get(JwtService);
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());
  const token = (id: string) =>
    jwt.sign({ sub: id, type: "access", tokenVersion: 1 });
  for (const path of [
    "/knowledge-base/admin/all",
    "/knowledge-base/admin/articles/fixture",
  ]) {
    it(`denies anonymous and customer access to ${path}`, async () => {
      await request(app.getHttpServer()).get(path).expect(401);
      await request(app.getHttpServer())
        .get(path)
        .auth(token(customer), { type: "bearer" })
        .expect(403);
      expect(service.searchArticles).not.toHaveBeenCalled();
      expect(service.getArticle).not.toHaveBeenCalled();
    });
  }
  it("allows verified editor to list and read drafts explicitly", async () => {
    await request(app.getHttpServer())
      .get("/knowledge-base/admin/all")
      .auth(token(editor), { type: "bearer" })
      .expect(200);
    expect(service.searchArticles).toHaveBeenCalledWith({}, false);
    await request(app.getHttpServer())
      .get("/knowledge-base/admin/articles/fixture")
      .auth(token(editor), { type: "bearer" })
      .expect(200);
    expect(service.getArticle).toHaveBeenCalledWith("fixture", false);
  });
  it("public route uses published default only", async () => {
    await request(app.getHttpServer())
      .get("/knowledge-base/articles/fixture")
      .expect(200);
    expect(service.getArticle).toHaveBeenCalledWith("fixture");
  });
});
