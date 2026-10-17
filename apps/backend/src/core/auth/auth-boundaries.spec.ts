import { ValidationPipe } from "@nestjs/common";
import { RegisterDto, registrationInput } from "./dto/register.dto";
import {
  isConfiguredPlatformAdmin,
  platformAdminIds,
} from "./platform-admin.policy";
import { jwtConfiguration } from "./jwt-configuration";

const adminId = "7f9b2f7c-5ec4-4a67-8424-f0d20e89a693";
const signup = {
  email: "person@example.com",
  password: "StrongPass123!",
  firstName: "Test",
  lastName: "Person",
};

describe("public registration boundary", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const validate = (body: object) =>
    pipe.transform(body, { type: "body", metatype: RegisterDto });
  it.each([
    "roleId",
    "primaryRoleId",
    "additionalRoleIds",
    "role",
    "isActive",
    "tenantId",
    "isPlatformAdmin",
  ])("rejects client-controlled privilege field %s", async (field) => {
    await expect(
      validate({ ...signup, [field]: adminId }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("allows only newsletter preferences in registration metadata", async () => {
    const input = {
      ...signup,
      metadata: {
        newsletterPreferences: {
          productUpdates: true,
          events: false,
          promotions: true,
        },
      },
    };
    await expect(validate(input)).resolves.toMatchObject(input);
    await expect(
      validate({ ...signup, metadata: { isAdmin: true } }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("does not forward arbitrary privilege fields even without the HTTP pipe", () => {
    expect(
      registrationInput({
        ...signup,
        roleId: adminId,
        isPlatformAdmin: true,
      } as RegisterDto),
    ).toEqual(signup);
  });
});

describe("server-managed platform authority", () => {
  it("requires an exact explicit ID; empty config grants nobody", () => {
    expect(isConfiguredPlatformAdmin(adminId, "")).toBe(false);
    expect(isConfiguredPlatformAdmin(adminId, ` ${adminId} `)).toBe(true);
    expect(isConfiguredPlatformAdmin("another-user", adminId)).toBe(false);
    expect(isConfiguredPlatformAdmin(adminId, adminId.toUpperCase())).toBe(
      true,
    );
  });
  it("rejects malformed provisioning configuration", () => {
    expect(() => platformAdminIds("super_admin")).toThrow(
      "PLATFORM_ADMIN_USER_IDS",
    );
  });
});

describe("JWT startup configuration", () => {
  it.each([undefined, "", "xyz-suite-secret-key"])(
    "rejects absent or weak secret",
    (secret) => {
      expect(() => jwtConfiguration(secret, "")).toThrow("JWT_SECRET");
    },
  );
  it("uses only the supplied strong secret", () => {
    const secret = "a-unique-local-test-secret-with-at-least-32-characters";
    expect(jwtConfiguration(secret, adminId)).toMatchObject({
      secret,
      signOptions: { expiresIn: "60m" },
    });
  });
});
