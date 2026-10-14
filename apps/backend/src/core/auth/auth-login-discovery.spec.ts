import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { TenantService } from "../tenant/tenant.service";

const account = (tenantId: string, name: string, extra: object = {}) => ({
  id: `user-${tenantId}`,
  email: "same@example.com",
  tenantId,
  isActive: true,
  emailVerified: true,
  password: `hash-${tenantId}`,
  tokenVersion: 1,
  organizationId: `org-${tenantId}`,
  organization: { id: `org-${tenantId}`, name, slug: tenantId, isActive: true },
  ...extra,
});

describe("login with tenant discovery", () => {
  const tenant = new TenantService();
  const users = {
    findLoginCandidatesByEmail: jest.fn(),
    findByEmail: jest.fn(),
    updateUser: jest.fn(),
  };
  const passwords = { comparePassword: jest.fn() };
  const jwt = { sign: jest.fn().mockReturnValue("signed") };
  const service = new (AuthService as any)(
    users,
    jwt,
    passwords,
    {},
    {},
    tenant,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.sign.mockReturnValue("signed");
  });

  it("spends one password comparison and answers 401 for an unknown email", async () => {
    users.findLoginCandidatesByEmail.mockResolvedValue([]);
    passwords.comparePassword.mockResolvedValue(false);

    await expect(
      service.discoverLogin("nobody@example.com", "secret1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwords.comparePassword).toHaveBeenCalledTimes(1);
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("gives a wrong password the same 401 as an unknown email", async () => {
    users.findLoginCandidatesByEmail.mockResolvedValue([
      account("tenant-a", "A"),
    ]);
    passwords.comparePassword.mockResolvedValue(false);

    const unknown = await service
      .discoverLogin("x@example.com", "secret1")
      .catch((error: Error) => error);
    users.findLoginCandidatesByEmail.mockResolvedValue([]);
    const missing = await service
      .discoverLogin("x@example.com", "secret1")
      .catch((error: Error) => error);

    expect(unknown).toBeInstanceOf(UnauthorizedException);
    expect((unknown as Error).message).toBe((missing as Error).message);
  });

  it("opens the session directly when exactly one workspace accepts the password", async () => {
    const a = account("tenant-a", "A");
    users.findLoginCandidatesByEmail.mockResolvedValue([
      a,
      account("tenant-b", "B"),
    ]);
    passwords.comparePassword.mockImplementation(
      async (_pw: string, hash: string) => hash === "hash-tenant-a",
    );
    users.findByEmail.mockResolvedValue(a);

    const result = await service.discoverLogin("same@example.com", "secret1");

    expect(result).toMatchObject({
      access_token: "signed",
      user: { tenantId: "tenant-a" },
    });
    expect(users.findByEmail).toHaveBeenCalledWith(
      "same@example.com",
      "tenant-a",
      true,
    );
    expect(users.updateUser).toHaveBeenCalledWith(
      "user-tenant-a",
      expect.any(Object),
      "tenant-a",
    );
  });

  it("lists only the workspaces whose password matched and issues no token", async () => {
    users.findLoginCandidatesByEmail.mockResolvedValue([
      account("tenant-b", "Beta"),
      account("tenant-a", "Alpha"),
      account("tenant-c", "Gamma"),
    ]);
    passwords.comparePassword.mockImplementation(
      async (_pw: string, hash: string) => hash !== "hash-tenant-c",
    );

    const result = await service.discoverLogin("same@example.com", "secret1");

    expect(result).toEqual({
      requiresTenantSelection: true,
      tenants: [
        { slug: "tenant-a", name: "Alpha" },
        { slug: "tenant-b", name: "Beta" },
      ],
    });
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("never accepts inactive or unverified accounts even if the lookup returns them", async () => {
    users.findLoginCandidatesByEmail.mockResolvedValue([
      account("tenant-a", "A", { isActive: false }),
      account("tenant-b", "B", { emailVerified: false }),
    ]);
    passwords.comparePassword.mockResolvedValue(true);

    await expect(
      service.discoverLogin("same@example.com", "secret1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.updateUser).not.toHaveBeenCalled();
  });

  it("skips workspaces the session guard would reject: no membership or an inactive organisation", async () => {
    users.findLoginCandidatesByEmail.mockResolvedValue([
      account("tenant-a", "A", { organizationId: null }),
      account("tenant-b", "B", {
        organization: {
          id: "org-tenant-b",
          name: "B",
          slug: "tenant-b",
          isActive: false,
        },
      }),
      account("tenant-c", "C", {
        organization: {
          id: "org-tenant-c",
          name: "C",
          slug: "other",
          isActive: true,
        },
      }),
    ]);
    passwords.comparePassword.mockResolvedValue(true);

    await expect(
      service.discoverLogin("same@example.com", "secret1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwords.comparePassword).toHaveBeenCalledTimes(1);
  });
});
