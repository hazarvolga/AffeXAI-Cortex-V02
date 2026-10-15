/**
 * F3.7 acceptance: a signed-in workspace user who opens the legacy /admin tree
 * lands on the same page in their workspace; sign-in pages and pages without a
 * workspace equivalent stay.
 *
 *   LEGACY_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 [CHROME_PATH=...] \
 *   node apps/frontend/scripts/acceptance/legacy-admin.cjs
 */
const path = require("node:path");
const { createRequire } = require("node:module");
const { repo, tenantFixture } = require("./lib/tenant-fixture.cjs");

if (process.env.LEGACY_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (LEGACY_ACCEPTANCE_ISOLATED=1)",
  );
}

const { chromium } = createRequire(path.join(repo, "package.json"))(
  "playwright",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const TENANT = "legacy-accept-a";
const PACE_MS = Number(process.env.PACE_MS || 1_500);
const fixture = tenantFixture({
  tenant: TENANT,
  email: "admin@legacy.test",
  password: "Fixture-Legacy-2026!",
  roleId: "d0000000-0000-4000-8000-000000000071",
  userId: "d1000000-0000-4000-8000-000000000071",
});

// [legacy path, expected pathname + search after redirects]
const CASES = [
  ["/admin", `/${TENANT}/admin`],
  ["/admin/cms/pages?status=draft", `/${TENANT}/admin/cms/pages?status=draft`],
  [
    "/admin/support/faq-learning/review",
    `/${TENANT}/admin/support/faq-learning/review`,
  ],
  ["/admin/users/roles/create-new-role", `/${TENANT}/admin/roles`],
  [
    "/admin/events/00000000-0000-4000-8000-00000000dead",
    `/${TENANT}/admin/events`,
  ],
  ["/admin/newsletter", `/${TENANT}/admin/email`],
  ["/admin/settings/billing", "/admin/settings/billing"],
];

(async () => {
  fixture.cleanup();
  fixture.seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  let passed = 0;
  try {
    const page = await (await browser.newContext()).newPage();
    await fixture.login(page, BASE_URL);
    for (const [legacy, expected] of CASES) {
      await page.goto(`${BASE_URL}${legacy}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForLoadState("load");
      const url = new URL(page.url());
      const landed = `${url.pathname}${url.search}`;
      const ok = landed === expected;
      if (ok) passed += 1;
      console.log(
        `${ok ? "PASS" : "FAIL"} ${legacy} -> ${landed}${ok ? "" : ` (expected ${expected})`}`,
      );
      await page.waitForTimeout(PACE_MS);
    }
    // Sign-in stays reachable without a session.
    const anonymous = await (await browser.newContext()).newPage();
    const response = await anonymous.goto(`${BASE_URL}/admin/login`);
    const loginOk =
      response?.status() === 200 &&
      new URL(anonymous.url()).pathname === "/admin/login";
    if (loginOk) passed += 1;
    console.log(
      `${loginOk ? "PASS" : "FAIL"} /admin/login without a session stays`,
    );
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") fixture.cleanup();
  }
  const total = CASES.length + 1;
  console.log(`${passed}/${total} redirects behaved`);
  process.exitCode = passed === total ? 0 : 1;
})();
