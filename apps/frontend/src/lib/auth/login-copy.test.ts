import assert from "node:assert/strict";
import { test } from "node:test";
import { LOGIN_COPY, loginFailureMessage, validateLogin } from "./login-copy";
import { LoginError } from "./login-outcome";

const valid = { email: "ada@ornek.com", password: "secret1", workspace: "" };

test("empty fields explain what is missing", () => {
  assert.deepEqual(validateLogin({ email: "", password: "", workspace: "" }), {
    email: LOGIN_COPY.errors.emailRequired,
    password: LOGIN_COPY.errors.passwordRequired,
  });
});

test("the workspace code is optional but must be well formed when given", () => {
  assert.deepEqual(validateLogin(valid), {});
  assert.deepEqual(
    validateLogin({ ...valid, workspace: "xyz-company-ui" }),
    {},
  );
  assert.equal(
    validateLogin({ ...valid, workspace: "xyz company" }).workspace,
    LOGIN_COPY.errors.workspaceInvalid,
  );
});

test("an invalid email is explained with an example", () => {
  assert.equal(
    validateLogin({ ...valid, email: "ada@" }).email,
    LOGIN_COPY.errors.emailInvalid,
  );
});

test("unknown email and wrong password produce the same message", () => {
  assert.equal(
    loginFailureMessage(new LoginError(401, "Invalid credentials")),
    LOGIN_COPY.failures.credentials,
  );
  assert.equal(
    loginFailureMessage(new LoginError(400, "password too short")),
    LOGIN_COPY.failures.credentials,
  );
});

test("throttling, outages and network failures get their own plain message", () => {
  assert.equal(
    loginFailureMessage(new LoginError(429, "x")),
    LOGIN_COPY.failures.rateLimited,
  );
  assert.equal(
    loginFailureMessage(new LoginError(503, "x")),
    LOGIN_COPY.failures.unavailable,
  );
  assert.equal(
    loginFailureMessage(new TypeError("fetch failed")),
    LOGIN_COPY.failures.network,
  );
});

test("raw server text never leaks into the message", () => {
  const message = loginFailureMessage(
    new LoginError(500, "QueryFailedError: relation users"),
  );
  assert.ok(!message.includes("QueryFailedError"));
});
