/**
 * F3.6 acceptance: the visual CMS editor saves, undoes, publishes and
 * unpublishes through the real API, and the database agrees at every step.
 *
 *   CMS_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 [CHROME_PATH=...] \
 *   node apps/frontend/scripts/acceptance/cms-workbench.cjs
 *
 * Steps are paced because the harness backend counts every API call against one IP.
 */
const path = require("node:path");
const { createRequire } = require("node:module");
const {
  AXE_PATH,
  repo,
  sql,
  tenantFixture,
} = require("./lib/tenant-fixture.cjs");

if (process.env.CMS_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (CMS_ACCEPTANCE_ISOLATED=1)",
  );
}

const { chromium } = createRequire(path.join(repo, "package.json"))(
  "playwright",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const TENANT = "cms-accept-a";
const SLUG = "kabul-sayfasi";
const PACE_MS = Number(process.env.PACE_MS || 2_500);
const fixture = tenantFixture({
  tenant: TENANT,
  email: "admin@cms.test",
  password: "Fixture-Cms-2026!",
  roleId: "dc000000-0000-4000-8000-000000000001",
  userId: "dd000000-0000-4000-8000-000000000001",
  extraCleanup: `DELETE FROM cms_pages WHERE tenant_id='${TENANT}';
    DELETE FROM cms_menu_items WHERE menu_id IN (SELECT id FROM cms_menus WHERE tenant_id='${TENANT}');
    DELETE FROM cms_menus WHERE tenant_id='${TENANT}';`,
});

const pageRow = () =>
  sql(
    `SELECT id || '|' || status FROM cms_pages WHERE tenant_id='${TENANT}' AND slug='${SLUG}'`,
  );
const componentIds = (pageId) =>
  sql(
    `SELECT string_agg(id::text, ',' ORDER BY id) FROM cms_components WHERE page_id='${pageId}'`,
  )
    .split(",")
    .filter(Boolean);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const status = (page) =>
  page.locator('p[role="status"]', { hasText: /Taslak|Yayında/ });

async function waitForStatus(page, pattern) {
  await status(page).filter({ hasText: pattern }).waitFor({ timeout: 20_000 });
}

async function addSection(page) {
  await page.getByRole("button", { name: "Bölüm ekle" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: /bölümünü ekle$/ })
    .first()
    .click();
  await dialog.waitFor({ state: "detached" });
}

const STEPS = [
  [
    "opens a new page as a clean draft",
    async (page) => {
      await page.goto(`${BASE_URL}/${TENANT}/admin/cms/editor`);
      await page
        .getByRole("heading", { level: 1, name: "Görsel CMS editörü" })
        .waitFor();
      await page.getByLabel("Sayfa başlığı").fill("Kabul Sayfası");
      await page.getByLabel("Sayfa adresi (slug)").fill(SLUG);
      await waitForStatus(page, /^Taslak$/);
    },
  ],
  [
    "an added section is reported as unsaved",
    async (page) => {
      await addSection(page);
      await waitForStatus(page, /Kaydedilmemiş değişiklikler/);
    },
  ],
  [
    "save creates the page and its component",
    async (page, state) => {
      await page.getByRole("button", { name: "Taslağı kaydet" }).click();
      await waitForStatus(page, /Taslak · Kaydedildi/);
      const [id, rowStatus] = pageRow().split("|");
      expect(id && rowStatus === "draft", `page row: ${id}|${rowStatus}`);
      expect(
        new URL(page.url()).searchParams.get("pageId") === id,
        "URL carries the new page id",
      );
      state.pageId = id;
      state.ids = componentIds(id);
      expect(
        state.ids.length === 1,
        `components after save: ${state.ids.length}`,
      );
    },
  ],
  [
    "saving again updates rows instead of re-creating them",
    async (page, state) => {
      await page.getByRole("button", { name: "Taslağı kaydet" }).click();
      await page.waitForTimeout(1_500);
      await waitForStatus(page, /Taslak · Kaydedildi/);
      expect(
        componentIds(state.pageId).join() === state.ids.join(),
        "component ids are stable across saves",
      );
    },
  ],
  [
    "undo returns to the saved state without writing",
    async (page, state) => {
      await addSection(page);
      await waitForStatus(page, /Kaydedilmemiş değişiklikler/);
      await page.getByRole("button", { name: "Geri al" }).click();
      await waitForStatus(page, /Taslak · Kaydedildi/);
      expect(
        componentIds(state.pageId).length === 1,
        "undo did not touch the database",
      );
    },
  ],
  [
    "reloading the editor shows the stored page as saved",
    async (page, state) => {
      await page.reload();
      await page.getByLabel("Sayfa başlığı").waitFor();
      await waitForStatus(page, /Taslak · Kaydedildi/);
      expect(
        (await page.getByLabel("Sayfa adresi (slug)").inputValue()) === SLUG,
        "slug reloaded",
      );
      expect(
        componentIds(state.pageId).join() === state.ids.join(),
        "reload changed nothing",
      );
    },
  ],
  [
    "publish saves pending changes first",
    async (page, state) => {
      await addSection(page);
      await page.getByRole("button", { name: "Yayınla" }).click();
      await waitForStatus(page, /Yayında · Kaydedildi/);
      expect(
        pageRow().split("|")[1] === "published",
        "page is published in the database",
      );
      expect(
        componentIds(state.pageId).length === 2,
        "the unsaved section was saved before publishing",
      );
    },
  ],
  [
    "unpublish asks first; Escape keeps the page live",
    async (page) => {
      await page.getByRole("button", { name: "Yayından kaldır" }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.waitFor();
      expect(
        (await dialog.textContent()).includes("Kabul Sayfası"),
        "dialog names the page",
      );
      // Destructive confirmations open with focus on the safe choice.
      await page.waitForFunction(
        () => document.activeElement?.textContent?.trim() === "Vazgeç",
        null,
        { timeout: 5_000 },
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      expect(pageRow().split("|")[1] === "published", "Escape changed nothing");
    },
  ],
  [
    "confirming unpublish returns the page to draft",
    async (page) => {
      await page.getByRole("button", { name: "Yayından kaldır" }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("button", { name: "Yayından kaldır" }).click();
      await dialog.waitFor({ state: "detached" });
      await waitForStatus(page, /^Taslak · Kaydedildi$/);
      expect(
        pageRow().split("|")[1] === "draft",
        "page is a draft in the database",
      );
    },
  ],
  [
    "a menu with nested items loads instead of looping",
    async (page) => {
      const result = await page.evaluate(async (tenant) => {
        // The session token the app stored at login (a JWT in local or session storage).
        const stores = [window.localStorage, window.sessionStorage];
        const token = stores
          .flatMap((store) =>
            Object.keys(store).map((key) => store.getItem(key)),
          )
          .find((v) => /^eyJ/.test(v ?? ""));
        const call = async (method, path, body) => {
          const response = await fetch(`/api${path}`, {
            method,
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`,
              "x-tenant-id": tenant,
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          const json = await response.json();
          return { status: response.status, data: json.data ?? json };
        };
        const menu = await call("POST", "/cms/menus", {
          name: "Kabul Menüsü",
          location: "header",
        });
        const root = await call("POST", "/cms/menus/items", {
          menuId: menu.data.id,
          type: "custom",
          label: "Ana",
          url: "/",
        });
        await call("POST", "/cms/menus/items", {
          menuId: menu.data.id,
          type: "custom",
          label: "Alt",
          url: "/alt",
          parentId: root.data.id,
        });
        const started = performance.now();
        const loaded = await Promise.race([
          call("GET", `/cms/menus/${menu.data.id}`),
          new Promise((resolve) =>
            setTimeout(() => resolve({ status: 0 }), 8000),
          ),
        ]);
        return {
          status: loaded.status,
          ms: Math.round(performance.now() - started),
          roots: loaded.data?.items?.length,
          children: loaded.data?.items?.[0]?.children?.length,
        };
      }, TENANT);
      expect(result.status === 200, `menu load: ${JSON.stringify(result)}`);
      expect(
        result.roots === 1 && result.children === 1,
        `nested items: ${JSON.stringify(result)}`,
      );
    },
  ],
  [
    "the editor has no serious axe violations at 1280 px",
    async (page) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addScriptTag({ path: AXE_PATH });
      const serious = await page.evaluate(async () => {
        const run = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        });
        return run.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}@${v.nodes[0].target}`);
      });
      expect(serious.length === 0, `axe: ${serious.join(", ")}`);
      expect(
        (await page.title()).startsWith("Görsel editör"),
        `title: ${await page.title()}`,
      );
    },
  ],
];

(async () => {
  fixture.cleanup();
  fixture.seed();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  let passed = 0;
  try {
    const page = await (
      await browser.newContext({ viewport: { width: 1280, height: 900 } })
    ).newPage();
    const nativeDialogs = [];
    page.on("dialog", (dialog) => {
      if (dialog.type() !== "beforeunload") nativeDialogs.push(dialog.type());
      void dialog.accept();
    });
    await fixture.login(page, BASE_URL);
    const state = {};
    for (const [name, run] of STEPS) {
      try {
        await run(page, state);
        expect(
          nativeDialogs.length === 0,
          `native dialog: ${nativeDialogs.join()}`,
        );
        passed += 1;
        console.log(`PASS ${name}`);
      } catch (error) {
        console.log(`FAIL ${name}: ${error.message.split("\n")[0]}`);
        if (process.env.FAIL_SCREENSHOT)
          await page.screenshot({ path: process.env.FAIL_SCREENSHOT });
        break;
      }
      await page.waitForTimeout(PACE_MS);
    }
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") fixture.cleanup();
  }
  console.log(`${passed}/${STEPS.length} steps passed`);
  process.exitCode = passed === STEPS.length ? 0 : 1;
})();
