import assert from "node:assert/strict";
import { test } from "node:test";
import {
  userDisplayName,
  userRoleId,
  userRoleLabel,
} from "./user-presentation";

test("a user without a name is shown by e-mail", () => {
  assert.equal(
    userDisplayName({ firstName: "", lastName: "", email: "a@b.co" }),
    "a@b.co",
  );
  assert.equal(
    userDisplayName({ firstName: "Ayşe", lastName: "Kaya", email: "a@b.co" }),
    "Ayşe Kaya",
  );
});

test("the primary role wins over the legacy role entity and the raw role string", () => {
  const primaryRole = {
    id: "r1",
    name: "admin",
    displayName: "Yönetici",
  } as never;
  const roleEntity = { id: "r2", name: "viewer" } as never;
  assert.equal(userRoleId({ primaryRole, roleEntity }), "r1");
  assert.equal(
    userRoleLabel({ primaryRole, roleEntity, role: "x" }),
    "Yönetici",
  );
  assert.equal(userRoleLabel({ roleEntity, role: "x" }), "viewer");
  assert.equal(userRoleLabel({ role: "" }), "Rol atanmamış");
});
