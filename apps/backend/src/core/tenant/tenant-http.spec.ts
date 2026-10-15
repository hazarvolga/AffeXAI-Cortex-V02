import {
  Controller,
  Get,
  INestApplication,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UsersService } from "../../modules/users/users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";
import { TenantGuard } from "../guards/tenant.guard";
import { TenantModule } from "./tenant.module";
import { TenantService } from "./tenant.service";

@Controller("tenant-proof")
class TenantProofController {
  constructor(private readonly tenants: TenantService) {}

  @Get("private")
  @UseGuards(JwtAuthGuard)
  async privateResource() {
    const before = this.tenants.getTenantContext()?.tenantId;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { before, after: this.tenants.getTenantId() };
  }

  @Get("explicit")
  @UseGuards(JwtAuthGuard, TenantGuard)
  explicitlyOrderedGuard() {
    return { tenant: this.tenants.getTenantId() };
  }

  @Get("missing-auth")
  @UseGuards(TenantGuard)
  missingAuthenticationGuard() {
    return { unexpected: true };
  }

  @Get("public")
  @Public()
  @UseGuards(JwtAuthGuard)
  publicResource() {
    return { tenant: this.tenants.getTenantId() ?? null };
  }

  @Get("failure")
  @UseGuards(JwtAuthGuard)
  async failure() {
    await new Promise((resolve) => setTimeout(resolve, 2));
    throw new ServiceUnavailableException("Intentional isolated test failure");
  }
}

describe("HTTP tenant authorization boundary", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const secret = "isolated-http-tenant-test-secret";
  const previousSecret = process.env.JWT_SECRET;
  const previousPlatformIds = process.env.PLATFORM_ADMIN_USER_IDS;
  const identities = {
    viewer: { id: "viewer", tenantId: "tenant-a", roleNames: ["viewer"] },
    admin: { id: "admin", tenantId: "tenant-a", roleNames: ["admin"] },
    super: { id: "super", tenantId: "tenant-a", roleNames: ["super_admin"] },
    other: { id: "other", tenantId: "tenant-b", roleNames: ["viewer"] },
    inactive: {
      id: "inactive",
      tenantId: "tenant-a",
      roleNames: ["viewer"],
      isActive: false,
    },
    closedOrganization: {
      id: "closed-organization",
      tenantId: "tenant-a",
      roleNames: ["viewer"],
      organization: { id: "org-a", slug: "tenant-a", isActive: false },
    },
    mismatchedOrganization: {
      id: "mismatched-organization",
      tenantId: "tenant-a",
      roleNames: ["viewer"],
      organization: { id: "org-b", slug: "tenant-b", isActive: true },
    },
    unassigned: {
      id: "unassigned",
      tenantId: undefined,
      roleNames: ["viewer"],
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    process.env.PLATFORM_ADMIN_USER_IDS = "";
    const module = await Test.createTestingModule({
      imports: [TenantModule, JwtModule.register({ secret })],
      controllers: [TenantProofController],
      providers: [
        JwtAuthGuard,
        TenantGuard,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(async (id: string) => {
              const identity = identities[id as keyof typeof identities];
              return identity
                ? {
                    isActive: true,
                    tokenVersion: 2,
                    roles: identity.roleNames.map((name) => ({ name })),
                    // Sessions require membership of the active organisation owning the tenant.
                    ...(identity.tenantId
                      ? {
                          organizationId: `org-${identity.tenantId}`,
                          organization: {
                            id: `org-${identity.tenantId}`,
                            slug: identity.tenantId,
                            isActive: true,
                          },
                        }
                      : {}),
                    ...identity,
                  }
                : null;
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    jwt = module.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousPlatformIds === undefined)
      delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = previousPlatformIds;
  });

  const tokenFor = (sub: string, extra: Record<string, unknown> = {}) =>
    jwt.sign({
      sub,
      type: "access",
      tokenVersion: 2,
      tenantId: "untrusted-claim",
      ...extra,
    });

  it("uses fresh identity without trusting the JWT tenant claim", async () => {
    const response = await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(tokenFor("viewer"), { type: "bearer" })
      .expect(200);
    expect(response.body).toEqual({ before: "tenant-a", after: "tenant-a" });
  });

  it("supports explicit post-auth guard ordering and fails closed without authentication", async () => {
    await request(app.getHttpServer())
      .get("/tenant-proof/explicit")
      .auth(tokenFor("viewer"), { type: "bearer" })
      .expect(200, { tenant: "tenant-a" });
    await request(app.getHttpServer())
      .get("/tenant-proof/missing-auth")
      .expect(401);
  });

  it.each(["viewer", "admin", "super"])(
    "rejects foreign tenant hints for %s",
    async (identity) => {
      await request(app.getHttpServer())
        .get("/tenant-proof/private")
        .set("x-tenant-id", "tenant-b")
        .auth(tokenFor(identity), { type: "bearer" })
        .expect(403);
    },
  );

  it("allows the matching tenant hint and rejects malformed hints", async () => {
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .set("x-tenant-id", "tenant-a")
      .auth(tokenFor("viewer"), { type: "bearer" })
      .expect(200, { before: "tenant-a", after: "tenant-a" });
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .set("x-tenant-id", "tenant-a,tenant-b")
      .auth(tokenFor("viewer"), { type: "bearer" })
      .expect(400);
  });

  it("preserves separate contexts across concurrent asynchronous requests", async () => {
    const responses = await Promise.all(
      ["viewer", "other", "viewer", "other"].map((identity) =>
        request(app.getHttpServer())
          .get("/tenant-proof/private")
          .auth(tokenFor(identity), { type: "bearer" })
          .expect(200),
      ),
    );
    expect(responses.map((response) => response.body)).toEqual(
      ["tenant-a", "tenant-b", "tenant-a", "tenant-b"].map((tenant) => ({
        before: tenant,
        after: tenant,
      })),
    );
  });

  it.each([
    ["refresh", { type: "refresh" }],
    ["missing purpose", { type: undefined }],
    ["missing version", { tokenVersion: undefined }],
    ["invalid version", { tokenVersion: 0 }],
    ["wrong purpose", { type: "verification" }],
    ["old version", { tokenVersion: 1 }],
  ])("rejects %s tokens", async (_label, claims) => {
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(tokenFor("viewer", claims as Record<string, unknown>), {
        type: "bearer",
      })
      .expect(401);
  });

  it("rejects inactive identities and invalid signatures", async () => {
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(tokenFor("inactive"), { type: "bearer" })
      .expect(401);
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(jwt.sign({ sub: "viewer" }, { secret: "wrong-secret" }), {
        type: "bearer",
      })
      .expect(401);
  });

  it.each(["closedOrganization", "mismatchedOrganization"])(
    "rejects identities with an unavailable organization: %s",
    async (identity) => {
      await request(app.getHttpServer())
        .get("/tenant-proof/private")
        .auth(tokenFor(identity), { type: "bearer" })
        .expect(401);
    },
  );

  it("rejects missing/expired credentials and identities without a tenant", async () => {
    await request(app.getHttpServer()).get("/tenant-proof/private").expect(401);
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(jwt.sign({ sub: "viewer", tokenVersion: 2 }, { expiresIn: -1 }), {
        type: "bearer",
      })
      .expect(401);
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(tokenFor("unassigned"), { type: "bearer" })
      // No organisation membership: the session itself is not accepted (session-eligibility).
      .expect(401);
  });

  it("does not leak tenant context after asynchronous handler failure", async () => {
    await request(app.getHttpServer())
      .get("/tenant-proof/failure")
      .auth(tokenFor("viewer"), { type: "bearer" })
      .expect(503);
    await request(app.getHttpServer())
      .get("/tenant-proof/public")
      .expect(200, { tenant: null });
    await request(app.getHttpServer())
      .get("/tenant-proof/private")
      .auth(tokenFor("other"), { type: "bearer" })
      .expect(200, { before: "tenant-b", after: "tenant-b" });
  });

  it("allows explicit public hints but does not decode unsigned identity or invent a default", async () => {
    await request(app.getHttpServer())
      .get("/tenant-proof/public")
      .set("x-tenant-id", "tenant-b")
      .expect(200, { tenant: "tenant-b" });
    await request(app.getHttpServer())
      .get("/tenant-proof/public")
      .auth(tokenFor("viewer"), { type: "bearer" })
      .expect(200, { tenant: null });
    await request(app.getHttpServer())
      .get("/tenant-proof/public")
      .expect(200, { tenant: null });
  });
});
