import { withMembership } from "../../core/auth/session-identity.fixture";
import { INestApplication, Type } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UsersService } from "../users/users.service";
import { TenantModule } from "../../core/tenant/tenant.module";
jest.mock("@nestjs/mapped-types", () => ({
  PartialType: require("@nestjs/swagger").PartialType,
}));

jest.mock("./template.service", () => ({ TemplateService: class {} }));
jest.mock("./services/unified-template.service", () => ({
  UnifiedTemplateService: class {},
}));
jest.mock("./services/template-preview.service", () => ({
  TemplatePreviewService: class {},
}));
jest.mock("./services/ab-test.service", () => ({ AbTestService: class {} }));
jest.mock("./services/bulk-export.service", () => ({
  BulkExportService: class {},
}));
jest.mock("./services/bulk-import.service", () => ({
  BulkImportService: class {},
}));
jest.mock("./services/custom-field.service", () => ({
  CustomFieldService: class {},
}));
jest.mock("./services/file-upload.service", () => ({
  FileUploadService: class {},
}));
jest.mock("./services/enhanced-file-security.service", () => ({
  EnhancedFileSecurityService: class {},
}));
jest.mock("./services/file-processing.service", () => ({
  FileProcessingService: class {},
}));
jest.mock("./services/gdpr-compliance.service", () => ({
  GdprComplianceService: class {},
  ConsentType: class {},
  ConsentMethod: class {},
  LegalBasis: class {},
  DataSubjectRequestType: class {},
}));
jest.mock("./services/bulk-operations-compliance.service", () => ({
  BulkOperationsComplianceService: class {},
}));
jest.mock("./services/export-cleanup.service", () => ({
  ExportCleanupService: class {},
}));
jest.mock("./services/predictive-analytics.service", () => ({
  PredictiveAnalyticsService: class {},
}));
jest.mock("./services/send-time-optimization.service", () => ({
  SendTimeOptimizationService: class {},
}));

const cases = [
  ["template", "get", "/email-templates"],
  ["validation", "post", "/email-marketing/validation/start"],
  ["controllers/ab-test", "post", "/email-marketing/ab-test"],
  ["controllers/bulk-export", "post", "/email-marketing/export"],
  [
    "controllers/bulk-import",
    "get",
    "/email-marketing/import/00000000-0000-4000-8000-000000000001/status",
  ],
  ["controllers/custom-field", "get", "/email-marketing/custom-fields"],
  ["controllers/file-upload", "post", "/email-marketing/files/cleanup"],
  [
    "controllers/gdpr-compliance",
    "post",
    "/email-marketing/gdpr/data-subject-request/erasure",
  ],
  ["controllers/job-management", "post", "/email-marketing/jobs/cleanup"],
  [
    "controllers/predictive-analytics",
    "get",
    "/email-marketing/analytics/insights",
  ],
  [
    "controllers/send-time-optimization",
    "get",
    "/email-marketing/optimization/global-stats",
  ],
] as const;
const controllers = cases.map(
  ([file]) =>
    Object.values(require(`./${file}.controller`)).find(
      (value) =>
        typeof value === "function" && value.name.endsWith("Controller"),
    ) as Type<unknown>,
);

describe("Remaining marketing administrative HTTP boundaries", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const calls = jest.fn(async () => []);
  const previousPlatformIds = process.env.PLATFORM_ADMIN_USER_IDS;
  const platformId = "00000000-0000-4000-8000-000000000111";
  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = platformId;
    const services = new Set(
      controllers.flatMap(
        (controller) =>
          Reflect.getMetadata("design:paramtypes", controller) || [],
      ),
    );
    const mod = await Test.createTestingModule({
      imports: [
        TenantModule,
        JwtModule.register({ secret: "isolated-marketing-admin-test-secret" }),
      ],
      controllers,
      providers: [
        ...Array.from(services).map((token) => ({
          provide: token as Type<unknown>,
          useValue: new Proxy(
            {},
            { get: (_target, key) => (key === "then" ? undefined : calls) },
          ),
        })),
        {
          provide: UsersService,
          useValue: {
            findOne: async (id: string) =>
              withMembership({
                id,
                tenantId: "ta",
                isActive: true,
                tokenVersion: 1,
                roleNames: ["member"],
                roles: [
                  {
                    name: "member",
                    permissions: id === "manager" ? ["marketing.manage"] : [],
                  },
                ],
              }),
          },
        },
      ],
    })
      .useMocker(
        () =>
          new Proxy(
            {},
            { get: (_target, key) => (key === "then" ? undefined : calls) },
          ),
      )
      .compile();
    app = mod.createNestApplication();
    await app.init();
    jwt = mod.get(JwtService);
  });
  afterAll(async () => {
    await app?.close();
    if (previousPlatformIds === undefined)
      delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = previousPlatformIds;
  });
  beforeEach(() => jest.clearAllMocks());
  const token = (sub: string) =>
    jwt.sign({ sub, type: "access", tokenVersion: 1 });
  it.each(cases)(
    "%s rejects anonymous and non-marketing users",
    async (_file, method, path) => {
      await request(app.getHttpServer())
        [method](path)
        .send({ email: "victim@example.test" })
        .expect(401);
      await request(app.getHttpServer())
        [method](path)
        .auth(token("viewer"), { type: "bearer" })
        .send({ email: "victim@example.test" })
        .expect(403);
      expect(calls).not.toHaveBeenCalled();
    },
  );
  it.each([
    "/email-marketing/jobs/cleanup",
    "/email-marketing/files/cleanup",
    "/email-marketing/gdpr/data-retention/cleanup",
  ])("denies tenant marketing manager global cleanup %s", async (path) => {
    await request(app.getHttpServer())
      .post(path)
      .auth(token("manager"), { type: "bearer" })
      .expect(403);
    expect(calls).not.toHaveBeenCalled();
  });
  it("preserves permitted tenant marketing operations", async () => {
    await request(app.getHttpServer())
      .get("/email-marketing/custom-fields")
      .auth(token("manager"), { type: "bearer" })
      .expect(200);
    expect(calls).toHaveBeenCalled();
  });
  it("allows explicit server-provisioned platform cleanup", async () => {
    await request(app.getHttpServer())
      .post("/email-marketing/files/cleanup")
      .auth(token(platformId), { type: "bearer" })
      .expect(201);
    expect(calls).toHaveBeenCalled();
  });
});
