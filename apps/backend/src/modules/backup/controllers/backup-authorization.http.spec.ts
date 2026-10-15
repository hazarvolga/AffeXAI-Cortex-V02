import { withMembership } from "../../../core/auth/session-identity.fixture";
import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
} from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PlatformAdminGuard } from "../../../core/auth/guards/platform-admin.guard";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { UsersService } from "../../users/users.service";
import { BackupController } from "./backup.controller";
import { BackupService } from "../services/backup.service";
import { BackupConfigService } from "../services/backup-config.service";
import { CloudUploadService } from "../services/cloud-upload.service";
import { ScheduledBackupService } from "../services/scheduled-backup.service";
import { GoogleDriveService } from "../services/google-drive.service";
import { OneDriveService } from "../services/onedrive.service";

const tenantAdmin = "11111111-1111-4111-8111-111111111111";
const platformAdmin = "22222222-2222-4222-8222-222222222222";
const superAdmin = "33333333-3333-4333-8333-333333333333";

describe("full-database backup platform boundary (HTTP)", () => {
  let app: INestApplication;
  let jwt: JwtService;
  const previousIds = process.env.PLATFORM_ADMIN_USER_IDS;
  const backups = {
    getAllBackups: jest.fn(() => []),
    createBackup: jest.fn(() => ({ id: "mock-backup" })),
  };
  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = platformAdmin;
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "backup-http-test-only-secret" })],
      controllers: [BackupController],
      providers: [
        JwtAuthGuard,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(async (id: string) =>
              withMembership({
                id,
                tenantId: "tenant-a",
                isActive: true,
                tokenVersion: 1,
                roleNames: [
                  id === superAdmin
                    ? "super_admin"
                    : id === platformAdmin
                      ? "viewer"
                      : "admin",
                ],
                roles: [
                  {
                    name:
                      id === superAdmin
                        ? "super_admin"
                        : id === platformAdmin
                          ? "viewer"
                          : "admin",
                  },
                ],
              }),
            ),
          },
        },
        { provide: BackupService, useValue: backups },
        ...[
          BackupConfigService,
          CloudUploadService,
          ScheduledBackupService,
          GoogleDriveService,
          OneDriveService,
        ].map((provide) => ({ provide, useValue: {} })),
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    jwt = module.get(JwtService);
  });
  afterAll(async () => {
    await app?.close();
    if (previousIds === undefined) delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = previousIds;
  });
  beforeEach(() => jest.clearAllMocks());
  const token = (sub: string) =>
    jwt.sign({ sub, type: "access", tokenVersion: 1, isPlatformAdmin: true });

  it("denies unauthenticated access", async () => {
    await request(app.getHttpServer()).get("/backup").expect(401);
  });
  it.each([tenantAdmin, superAdmin])(
    "denies tenant-controlled admin roles and signed platform claims for %s",
    async (id) => {
      for (const path of [
        "/backup",
        "/backup/example",
        "/backup/example/download",
        "/backup/config/settings",
        "/backup/cloud/s3/list",
      ]) {
        await request(app.getHttpServer())
          .get(path)
          .auth(token(id), { type: "bearer" })
          .expect(403);
      }
      await request(app.getHttpServer())
        .post("/backup")
        .auth(token(id), { type: "bearer" })
        .send({})
        .expect(403);
      await request(app.getHttpServer())
        .delete("/backup/example")
        .auth(token(id), { type: "bearer" })
        .expect(403);
      expect(backups.getAllBackups).not.toHaveBeenCalled();
      expect(backups.createBackup).not.toHaveBeenCalled();
    },
  );
  it("allows a server-provisioned platform administrator", async () => {
    await request(app.getHttpServer())
      .get("/backup")
      .auth(token(platformAdmin), { type: "bearer" })
      .expect(200, []);
    expect(backups.getAllBackups).toHaveBeenCalledWith("tenant-a");
    await request(app.getHttpServer())
      .post("/backup")
      .auth(token(platformAdmin), { type: "bearer" })
      .send({ type: "database" })
      .expect(201);
    expect(backups.createBackup).toHaveBeenCalledWith("tenant-a", {
      type: "database",
      triggeredBy: platformAdmin,
    });
  });
});

// Runtime guard boundary rejects truthy values, not just missing authority.
describe("platform authority flag", () => {
  it.each([false, undefined, "true", 1])(
    "rejects a non-boolean platform flag %p",
    (flag) => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { isPlatformAdmin: flag } }),
        }),
      } as ExecutionContext;
      expect(() => new PlatformAdminGuard().canActivate(context)).toThrow(
        ForbiddenException,
      );
    },
  );
});
