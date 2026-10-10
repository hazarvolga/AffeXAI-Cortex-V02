import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../../modules/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "../../modules/mail/mail.service";
import { SettingsService } from "../../modules/settings/settings.service";
import { AuthUtilsService } from "../../core/shared/auth-utils.service";
import { TenantService } from "../tenant/tenant.service";

describe("AuthService - Multi-Tenancy Tests", () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailService;
  let settingsService: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TenantService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            findByEmail: jest.fn(),
            updateUser: jest.fn(),
            rotateRefreshToken: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getFrontendUrl: jest.fn(),
          },
        },
        {
          provide: AuthUtilsService,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  describe("Sprint 1: sendVerificationEmail - No hardcoded default", () => {
    it("should use tenant-specific settings for email", async () => {
      // Arrange
      const userId = "user-123";
      const email = "test@example.com";
      const firstName = "John";
      const tenantId = "tenant-a";

      jest
        .spyOn(service, "createEmailVerificationToken")
        .mockResolvedValue("token-123");
      jest
        .spyOn(settingsService, "getFrontendUrl")
        .mockResolvedValue("https://tenanta.com");
      jest
        .spyOn(mailService, "sendMail")
        .mockResolvedValue({
          success: true,
          provider: "mock",
          timestamp: new Date(),
        });

      // Act
      await service.sendVerificationEmail(userId, email, firstName, tenantId);

      // Assert
      expect(settingsService.getFrontendUrl).toHaveBeenCalledWith(tenantId);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email, name: firstName }],
        }),
        tenantId,
      );
    });

    it("should use different settings for different tenants", async () => {
      // Arrange
      const tenantAId = "tenant-a";
      const tenantBId = "tenant-b";

      jest
        .spyOn(service, "createEmailVerificationToken")
        .mockResolvedValue("token");
      jest
        .spyOn(mailService, "sendMail")
        .mockResolvedValue({
          success: true,
          provider: "mock",
          timestamp: new Date(),
        });

      // Mock different URLs for different tenants
      jest
        .spyOn(settingsService, "getFrontendUrl")
        .mockImplementation((tenantId) => {
          if (tenantId === tenantAId)
            return Promise.resolve("https://tenanta.com");
          if (tenantId === tenantBId)
            return Promise.resolve("https://tenantb.com");
          return Promise.resolve("https://default.com");
        });

      // Act & Assert - Tenant A
      await service.sendVerificationEmail(
        "user1",
        "user@tenanta.com",
        "John",
        tenantAId,
      );
      expect(settingsService.getFrontendUrl).toHaveBeenCalledWith(tenantAId);

      // Act & Assert - Tenant B
      await service.sendVerificationEmail(
        "user2",
        "user@tenantb.com",
        "Jane",
        tenantBId,
      );
      expect(settingsService.getFrontendUrl).toHaveBeenCalledWith(tenantBId);
    });
  });

  describe("Sprint 2: refreshAccessToken - Preserve tenantId", () => {
    it("should preserve tenantId in new access token", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        tokenVersion: 1,
        tenantId: "tenant-a",
        isActive: true,
        refreshToken: "old-refresh-token",
        refreshTokenExpires: new Date(Date.now() + 86400000),
      };

      const mockPayload = {
        sub: "user-123",
        type: "refresh",
        tokenVersion: 1,
        jti: "unique-refresh-id",
        tenantId: "tenant-a",
      };

      jest.spyOn(jwtService, "verify").mockReturnValue(mockPayload);
      jest.spyOn(usersService, "findOne").mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, "updateUser").mockResolvedValue(undefined);
      jest.spyOn(jwtService, "sign").mockReturnValue("new-token");

      // Act
      await service.refreshAccessToken("old-refresh-token");

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          tokenVersion: mockUser.tokenVersion,
          tenantId: mockUser.tenantId,
        }),
        { expiresIn: "60m" },
      );
    });

    it("should maintain tenant isolation across token refresh", async () => {
      // Arrange
      const tenantAUser = {
        id: "user-a",
        email: "usera@tenanta.com",
        tokenVersion: 1,
        tenantId: "tenant-a",
        isActive: true,
        refreshToken: "refresh-a",
        refreshTokenExpires: new Date(Date.now() + 86400000),
      };

      const tenantBUser = {
        id: "user-b",
        email: "userb@tenantb.com",
        tokenVersion: 1,
        tenantId: "tenant-b",
        isActive: true,
        refreshToken: "refresh-b",
        refreshTokenExpires: new Date(Date.now() + 86400000),
      };

      jest
        .spyOn(jwtService, "verify")
        .mockReturnValueOnce({
          sub: "user-a",
          type: "refresh",
          tokenVersion: 1,
          jti: "unique-refresh-id",
          tenantId: "tenant-a",
        })
        .mockReturnValueOnce({
          sub: "user-b",
          type: "refresh",
          tokenVersion: 1,
          jti: "unique-refresh-id",
          tenantId: "tenant-b",
        });

      jest
        .spyOn(usersService, "findOne")
        .mockResolvedValueOnce(tenantAUser as any)
        .mockResolvedValueOnce(tenantBUser as any);

      jest.spyOn(usersService, "updateUser").mockResolvedValue(undefined);

      const signedTokens: any[] = [];
      jest.spyOn(jwtService, "sign").mockImplementation((payload) => {
        signedTokens.push(payload);
        return "token";
      });

      // Act
      await service.refreshAccessToken("refresh-a");
      await service.refreshAccessToken("refresh-b");

      // Assert
      const accessTokens = signedTokens.filter(
        (token) => token.type === "access",
      );
      expect(accessTokens[0]).toMatchObject({ tenantId: "tenant-a" });
      expect(accessTokens[1]).toMatchObject({ tenantId: "tenant-b" });
    });
  });
});
