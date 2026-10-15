import {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  TENANT_PERMISSION_CATALOG,
  getPermissionCategory,
  isValidPermission,
} from "./permissions";

describe("permissions catalog", () => {
  it("accepts every declared permission", () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(isValidPermission(permission)).toBe(true);
    }
  });

  it("accepts legacy template permissions kept for seeded roles", () => {
    expect(isValidPermission("ticket:read")).toBe(true);
    expect(TENANT_PERMISSION_CATALOG.has("certificate:issue")).toBe(true);
  });

  it("rejects unknown and wildcard permissions", () => {
    expect(isValidPermission("users.view.everything")).toBe(false);
    expect(isValidPermission("*")).toBe(false);
    expect(isValidPermission("")).toBe(false);
  });

  it("resolves the UI category of a categorised permission", () => {
    expect(getPermissionCategory(PERMISSIONS.USERS_VIEW)).toBe(
      PERMISSION_CATEGORIES.USER_MANAGEMENT,
    );
    expect(getPermissionCategory(PERMISSIONS.FORMS_MANAGE)).toBe(
      PERMISSION_CATEGORIES.FORMS,
    );
  });

  it("returns undefined for permissions without a category", () => {
    expect(getPermissionCategory("ticket:read")).toBeUndefined();
    expect(getPermissionCategory("nope.nope")).toBeUndefined();
  });
});
