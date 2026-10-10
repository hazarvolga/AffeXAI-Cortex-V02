import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../../modules/users/users.service";
import { AuthUtilsService } from "../shared/auth-utils.service";
import { MailService } from "../../modules/mail/mail.service";
import { SettingsService } from "../../modules/settings/settings.service";
import { TenantService } from "../tenant/tenant.service";
import { createHash } from "crypto";

const future = () => new Date(Date.now() + 60_000);
const verificationToken = `verify_${"a".repeat(64)}`;
const refreshHash = (token: string) => `refresh_hash_${createHash("sha256").update(token).digest("hex")}`;

describe("authentication token lifecycle", () => {
  const previousPlatformIds = process.env.PLATFORM_ADMIN_USER_IDS;
  const jwt = new JwtService({
    secret: "isolated-session-test-secret-at-least-32-chars",
  });
  const users = {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    updateUser: jest.fn(),
    findByVerificationToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    changePasswordCredentials: jest.fn(),
    consumeEmailVerificationToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
    revokeSessions: jest.fn(),
    consumeInvitationToken: jest.fn(),
  };
  const passwords = { comparePassword: jest.fn(), hashPassword: jest.fn() };
  const tenants = new TenantService();
  const mail = { sendMail: jest.fn() };
  const settings = { getFrontendUrl: jest.fn() };
  const service = new AuthService(
    users as unknown as UsersService,
    jwt,
    passwords as unknown as AuthUtilsService,
    mail as unknown as MailService,
    settings as unknown as SettingsService,
    tenants,
  );
  const identity = () => ({
    id: "u",
    email: "person@example.com",
    tenantId: "a",
    isActive: true,
    tokenVersion: 2,
    emailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: future(),
    password: "old-hash",
  });
  const refresh = (claims: object = {}) =>
    jwt.sign(
      { sub: "u", type: "refresh", tokenVersion: 2, jti: "old-jti", ...claims },
      { expiresIn: "7d" },
    );

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_USER_IDS = "";
    jest.resetAllMocks();
    users.rotateRefreshToken.mockResolvedValue(true);
    users.changePasswordCredentials.mockResolvedValue(true);
    users.consumeEmailVerificationToken.mockResolvedValue(true);
    users.consumePasswordResetToken.mockResolvedValue(true);
    users.revokeSessions.mockResolvedValue(true);
    users.consumeInvitationToken.mockResolvedValue(true);
    passwords.comparePassword.mockResolvedValue(true);
    passwords.hashPassword.mockResolvedValue("new-hash");
    settings.getFrontendUrl.mockResolvedValue("https://tenant.example");
    mail.sendMail.mockResolvedValue({ success: true });
  });

  afterAll(() => {
    if (previousPlatformIds === undefined)
      delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = previousPlatformIds;
  });

  it("returns platform authority only from server provisioning, not a role-shaped identity", async () => {
    users.findByEmail.mockResolvedValue({
      ...identity(),
      emailVerified: true,
      roleNames: ["super_admin"],
      isPlatformAdmin: true,
    });
    const session = await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.login({ email: "person@example.com", password: "correct" }),
    );
    expect(session.user).toMatchObject({
      tenantId: "a",
      isPlatformAdmin: false,
    });
    const platformId = "7f9b2f7c-5ec4-4a67-8424-f0d20e89a693";
    process.env.PLATFORM_ADMIN_USER_IDS = platformId;
    users.findByEmail.mockResolvedValue({ ...identity(), id: platformId, emailVerified: true });
    const platformSession = await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.login({ email: "person@example.com", password: "correct" }),
    );
    expect(platformSession.user.isPlatformAdmin).toBe(true);
  });

  it("issues distinct refresh nonces and revocation versions on password login", async () => {
    users.findByEmail.mockResolvedValue({ ...identity(), emailVerified: true });
    const sessions = await tenants.runWithTenant({ tenantId: "a" }, () =>
      Promise.all([
        service.login({ email: "person@example.com", password: "correct" }),
        service.login({ email: "person@example.com", password: "correct" }),
      ]),
    );
    expect(sessions[0].refresh_token).not.toEqual(sessions[1].refresh_token);
    expect(jwt.verify(sessions[0].refresh_token)).toMatchObject({
      type: "refresh",
      tokenVersion: 2,
      jti: expect.any(String),
    });
    expect(users.updateUser).toHaveBeenCalledWith(
      "u",
      expect.objectContaining({
        refreshToken: expect.stringMatching(/^refresh_hash_[a-f0-9]{64}$/),
      }),
      "a",
    );
    expect(users.updateUser.mock.calls[0][1].refreshToken).not.toBe(
      sessions[0].refresh_token,
    );
  });

  it("returns current role, organization and profile information without credential material", async () => {
    const role = { id: "role-a", name: "admin", displayName: "Tenant admin" };
    users.findByEmail.mockResolvedValue({
      ...identity(),
      emailVerified: true,
      metadata: { newsletter: true },
      userRoles: [{ role, isPrimary: true }],
      roleEntity: role,
      organization: { id: "org-a", name: "Tenant A", slug: "a" },
    });
    const session = await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.login({ email: "person@example.com", password: "correct" }),
    );
    expect(session.user).toMatchObject({
      roles: [{ ...role, isPrimary: true }],
      primaryRole: role,
      organization: { id: "org-a", name: "Tenant A", slug: "a" },
      metadata: { newsletter: true },
    });
    expect(session.user).not.toHaveProperty("password");
    expect(session.user).not.toHaveProperty("emailVerificationToken");
  });

  it("preserves the legacy primary role when no multi-role primary is assigned", async () => {
    const role = { id: "role-a", name: "viewer", displayName: "Viewer" };
    users.findByEmail.mockResolvedValue({
      ...identity(),
      emailVerified: true,
      userRoles: [{ role, isPrimary: false }],
      roleEntity: role,
    });
    const session = await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.login({ email: "person@example.com", password: "correct" }),
    );
    expect(session.user.primaryRole).toEqual(role);
  });

  it("does not issue a session on rejected password login", async () => {
    users.findByEmail.mockResolvedValue(identity());
    passwords.comparePassword.mockResolvedValue(false);
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.login({ email: "person@example.com", password: "wrong" }),
      ),
    ).resolves.toBeNull();
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("does not issue a password session before email ownership is verified", async () => {
    users.findByEmail.mockResolvedValue(identity());
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.login({ email: "person@example.com", password: "correct" }),
      ),
    ).resolves.toBeNull();
    expect(passwords.comparePassword).not.toHaveBeenCalled();
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("checks email existence only inside the requested tenant", async () => {
    users.findByEmail
      .mockResolvedValueOnce(identity())
      .mockResolvedValueOnce(null);
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.checkEmailExists("person@example.com"),
      ),
    ).resolves.toBe(true);
    await expect(
      tenants.runWithTenant({ tenantId: "b" }, () =>
        service.checkEmailExists("person@example.com"),
      ),
    ).resolves.toBe(false);
    expect(users.findByEmail).toHaveBeenLastCalledWith(
      "person@example.com",
      "b",
      true,
    );
  });

  it.each([
    ["inactive", { isActive: false }, {}],
    ["version revoked", {}, { tokenVersion: 1 }],
    ["legacy no version", {}, { tokenVersion: undefined }],
    ["missing stored expiry", { refreshTokenExpires: null }, {}],
    ["expired stored token", { refreshTokenExpires: new Date(0) }, {}],
  ])("rejects refresh when %s", async (_label, overrides, claims) => {
    const token = refresh(claims);
    users.findOne.mockResolvedValue({
      ...identity(),
      refreshToken: refreshHash(token),
      refreshTokenExpires: future(),
      ...overrides,
    });
    await expect(service.refreshAccessToken(token)).rejects.toMatchObject({
      status: 401,
    });
    expect(users.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("uses atomic compare-and-swap for rotation and rejects the losing concurrent refresh", async () => {
    const token = refresh();
    users.findOne.mockResolvedValue({
      ...identity(),
      refreshToken: refreshHash(token),
      refreshTokenExpires: future(),
    });
    users.rotateRefreshToken
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const outcomes = await Promise.allSettled([
      service.refreshAccessToken(token),
      service.refreshAccessToken(token),
    ]);
    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === "rejected"),
    ).toHaveLength(1);
    expect(users.rotateRefreshToken).toHaveBeenCalledWith(
      "u",
      "a",
      token,
      2,
      expect.any(String),
      expect.any(Date),
    );
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("does not permit a foreign tenant hint during refresh", async () => {
    const token = refresh();
    users.findOne.mockResolvedValue({
      ...identity(),
      refreshToken: refreshHash(token),
      refreshTokenExpires: future(),
    });
    await expect(
      tenants.runWithTenant({ tenantId: "b" }, () =>
        service.refreshAccessToken(token),
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(users.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("changes password through revoking atomic persistence scoped to current tenant", async () => {
    users.findOne.mockResolvedValue(identity());
    await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.changePassword("u", {
        currentPassword: "old",
        newPassword: "new-password",
      }),
    );
    expect(users.changePasswordCredentials).toHaveBeenCalledWith(
      "u",
      "a",
      "new-hash",
      2,
    );
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("does not change credentials after a concurrent version change", async () => {
    users.findOne.mockResolvedValue(identity());
    users.changePasswordCredentials.mockResolvedValue(false);
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.changePassword("u", {
          currentPassword: "old",
          newPassword: "new-password",
        }),
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rejects wrong current passwords before hashing or credential persistence", async () => {
    users.findOne.mockResolvedValue(identity());
    passwords.comparePassword.mockResolvedValue(false);
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.changePassword("u", {
          currentPassword: "wrong",
          newPassword: "new-password",
        }),
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(passwords.hashPassword).not.toHaveBeenCalled();
    expect(users.changePasswordCredentials).not.toHaveBeenCalled();
  });

  it("rejects suspended password changes before comparison", async () => {
    users.findOne.mockResolvedValue({ ...identity(), isActive: false });
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.changePassword("u", {
          currentPassword: "old",
          newPassword: "new-password",
        }),
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(passwords.comparePassword).not.toHaveBeenCalled();
  });

  it("issues verification-only tokens, not reset-compatible raw tokens", () => {
    expect(service.generateVerificationToken()).toMatch(
      /^verify_[a-f0-9]{64}$/,
    );
  });

  it("issues purpose-bound password reset tokens", () => {
    expect(service.generatePasswordResetToken()).toMatch(/^reset_[a-f0-9]{64}$/);
  });

  it("stores and sends a tenant-scoped password reset request", async () => {
    users.findByEmail.mockResolvedValue(identity());
    await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.requestPasswordReset("person@example.com"),
    );
    expect(users.updateUser).toHaveBeenCalledWith(
      "u",
      {
        emailVerificationToken: expect.stringMatching(/^reset_hash_[a-f0-9]{64}$/),
        emailVerificationExpires: expect.any(Date),
      },
      "a",
    );
    expect(mail.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("https://tenant.example/reset-password?token=reset_"),
      }),
      "a",
    );
  });

  it("atomically consumes a reset token, verifies ownership and revokes sessions", async () => {
    const token = `reset_${"b".repeat(64)}`;
    users.findByVerificationToken.mockResolvedValue({
      ...identity(),
      emailVerificationToken: token,
    });
    await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.resetPassword(token, "new-password"),
    );
    expect(users.findByVerificationToken).toHaveBeenCalledWith(
      expect.stringMatching(/^reset_hash_[a-f0-9]{64}$/),
    );
    expect(users.consumePasswordResetToken).toHaveBeenCalledWith(
      "u",
      "a",
      token,
      "new-hash",
    );
  });

  it("rejects reset tokens presented under another tenant", async () => {
    const token = `reset_${"c".repeat(64)}`;
    users.findByVerificationToken.mockResolvedValue({
      ...identity(),
      emailVerificationToken: token,
    });
    await expect(
      tenants.runWithTenant({ tenantId: "b" }, () => service.resetPassword(token, "new-password")),
    ).rejects.toMatchObject({ status: 400 });
    expect(users.consumePasswordResetToken).not.toHaveBeenCalled();
  });

  it("revokes the server-side session on logout", async () => {
    await tenants.runWithTenant({ tenantId: "a" }, () => service.logout("u", 2));
    expect(users.revokeSessions).toHaveBeenCalledWith("u", "a", 2);
  });

  it("keeps forgot-password responses indistinguishable for unknown accounts", async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () =>
        service.requestPasswordReset("missing@example.com"),
      ),
    ).resolves.toBeUndefined();
    expect(users.updateUser).not.toHaveBeenCalled();
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it("rejects a lost logout race instead of claiming revocation", async () => {
    users.revokeSessions.mockResolvedValue(false);
    await expect(
      tenants.runWithTenant({ tenantId: "a" }, () => service.logout("u", 2)),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("accepts a tenant-scoped invitation exactly through atomic persistence", async () => {
    const token = `invite_${"d".repeat(64)}`;
    users.findByVerificationToken.mockResolvedValue(identity());
    await tenants.runWithTenant({ tenantId: "a" }, () =>
      service.acceptInvitation(token, "new-password"),
    );
    expect(users.findByVerificationToken).toHaveBeenCalledWith(
      expect.stringMatching(/^invite_hash_[a-f0-9]{64}$/),
    );
    expect(users.consumeInvitationToken).toHaveBeenCalledWith(
      "u",
      "a",
      token,
      "new-hash",
    );
  });

  it("rejects an invitation in a foreign tenant before credential persistence", async () => {
    const token = `invite_${"e".repeat(64)}`;
    users.findByVerificationToken.mockResolvedValue(identity());
    await expect(
      tenants.runWithTenant({ tenantId: "b" }, () =>
        service.acceptInvitation(token, "new-password"),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(users.consumeInvitationToken).not.toHaveBeenCalled();
  });

  it("stores a scoped verification token and propagates delivery failure instead of claiming sent", async () => {
    mail.sendMail.mockRejectedValue(new Error("mock transport unavailable"));
    await expect(
      service.sendVerificationEmail("u", "person@example.com", "Person", "a"),
    ).rejects.toMatchObject({ status: 503 });
    expect(users.updateUser).toHaveBeenCalledWith(
      "u",
      {
        emailVerificationToken: expect.stringMatching(/^verify_hash_[a-f0-9]{64}$/),
        emailVerificationExpires: expect.any(Date),
      },
      "a",
    );
  });

  it("sends verification with the matching tenant context through the mocked mail transport", async () => {
    await service.sendVerificationEmail(
      "u",
      "person@example.com",
      "Person",
      "a",
    );
    expect(settings.getFrontendUrl).toHaveBeenCalledWith("a");
    expect(mail.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          "https://tenant.example/verify-email/verify_",
        ),
      }),
      "a",
    );
  });

  it("does not send verification links with an unsafe configured protocol", async () => {
    settings.getFrontendUrl.mockResolvedValue("javascript:alert(1)");
    await expect(
      service.sendVerificationEmail("u", "person@example.com", "Person", "a"),
    ).rejects.toMatchObject({ status: 503 });
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it("requires tenant scope when creating a verification token", async () => {
    await expect(
      service.createEmailVerificationToken("u", ""),
    ).rejects.toMatchObject({ status: 401 });
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it.each([{ success: false, error: "mock delivery rejected" }, undefined])(
    "fails closed on an unsuccessful mail result %j",
    async (result) => {
      mail.sendMail.mockResolvedValue(result);
      await expect(
        service.sendVerificationEmail("u", "person@example.com", "Person", "a"),
      ).rejects.toMatchObject({ status: 503 });
    },
  );

  it("escapes recipient-controlled HTML and uses the product authentication brand", async () => {
    await service.sendVerificationEmail(
      "u",
      "person@example.com",
      "<img src=x onerror=alert(1)>",
      "a",
    );
    const options = mail.sendMail.mock.calls[0][0];
    expect(options.html).not.toContain("<img src=x");
    expect(options.html).toContain("&lt;img");
    expect(options.subject).toContain("AffeXAI Cortex");
    expect(options.html).not.toContain("Aluplan");
  });

  it("issues verified-login sessions through the same scoped and versioned issuer", async () => {
    users.findOne.mockResolvedValue({ ...identity(), emailVerified: true });
    const session = await service.createVerifiedSession("u", "a");
    expect(users.findOne).toHaveBeenCalledWith("u", "a");
    expect(jwt.verify(session.refresh_token)).toMatchObject({
      type: "refresh",
      tokenVersion: 2,
      jti: expect.any(String),
    });
    expect(jwt.verify(session.access_token)).toMatchObject({
      type: "access",
      tenantId: "a",
    });
  });

  it("refuses verified-session creation if the account becomes suspended", async () => {
    users.findOne.mockResolvedValue({
      ...identity(),
      emailVerified: true,
      isActive: false,
    });
    await expect(service.createVerifiedSession("u", "a")).rejects.toMatchObject(
      { status: 401 },
    );
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("rejects legacy/reset-purpose tokens before lookup", async () => {
    users.findByVerificationToken.mockResolvedValue(identity());
    await expect(service.verifyEmail("a".repeat(64))).resolves.toBeNull();
    expect(users.findByVerificationToken).not.toHaveBeenCalled();
  });

  it.each([
    ["suspended", { isActive: false }],
    ["already verified", { emailVerified: true }],
    ["missing expiry", { emailVerificationExpires: null }],
    ["expired", { emailVerificationExpires: new Date(0) }],
  ])("cannot verify an account that is %s", async (_label, overrides) => {
    users.findByVerificationToken.mockResolvedValue({
      ...identity(),
      ...overrides,
    });
    await expect(service.verifyEmail(verificationToken)).resolves.toBeNull();
    expect(users.consumeEmailVerificationToken).not.toHaveBeenCalled();
  });

  it("consumes verification once and never writes isActive or undefined clearing fields", async () => {
    users.findByVerificationToken.mockResolvedValue(identity());
    users.consumeEmailVerificationToken
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const outcomes = await Promise.all([
      service.verifyEmail(verificationToken),
      service.verifyEmail(verificationToken),
    ]);
    expect(outcomes.filter(Boolean)).toHaveLength(1);
    expect(users.consumeEmailVerificationToken).toHaveBeenCalledWith(
      "u",
      "a",
      verificationToken,
    );
    expect(users.findByVerificationToken).toHaveBeenCalledWith(
      expect.stringMatching(/^verify_hash_[a-f0-9]{64}$/),
    );
    expect(users.updateUser).not.toHaveBeenCalled();
  });
});
