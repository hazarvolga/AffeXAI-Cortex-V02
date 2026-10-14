import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inviteErrorMessage,
  validateInvite,
  type InviteValues,
} from "./invite-form";

const valid: InviteValues = {
  firstName: "Ayşe",
  lastName: "Kaya",
  email: "ayse@acme.test",
  roleId: "r1",
  phone: "",
  city: "",
  country: "",
};

test("a complete invite has no errors", () => {
  assert.deepEqual(validateInvite(valid), {});
});

test("required fields and the e-mail format are explained in order", () => {
  const errors = validateInvite({
    ...valid,
    firstName: " ",
    email: "ayse@",
    roleId: "",
  });
  assert.deepEqual(Object.keys(errors), ["firstName", "email", "roleId"]);
  assert.match(errors.email ?? "", /geçerli bir e-posta/);
});

test("server failures become plain Turkish messages without raw details", () => {
  assert.match(inviteErrorMessage(409), /zaten/);
  assert.match(inviteErrorMessage(403), /yetki/);
  assert.match(inviteErrorMessage(500), /Davet gönderilemedi/);
});
