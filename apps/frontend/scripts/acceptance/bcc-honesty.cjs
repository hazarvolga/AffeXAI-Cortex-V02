/**
 * F4 acceptance (items 1–2): BCC and platform console surfaces never pass
 * sample values as measurements, and the decision card works on a tenant page.
 *
 *   BCC_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 [CHROME_PATH=...] \
 *   node apps/frontend/scripts/acceptance/bcc-honesty.cjs
 */
const path = require("node:path");
const { createRequire } = require("node:module");
const { AXE_PATH, repo, tenantFixture } = require("./lib/tenant-fixture.cjs");

if (process.env.BCC_ACCEPTANCE_ISOLATED !== "1") {
  throw new Error(
    "Isolated acceptance marker required (BCC_ACCEPTANCE_ISOLATED=1)",
  );
}

const { chromium } = createRequire(path.join(repo, "package.json"))(
  "playwright",
);

const BASE_URL = process.env.BASE_URL || "http://localhost:19003";
const TENANT = "bcc-accept-a";
const PACE_MS = Number(process.env.PACE_MS || 2_500);
const fixture = tenantFixture({
  tenant: TENANT,
  email: "admin@bcc.test",
  password: "Fixture-Bcc-2026!",
  roleId: "d2000000-0000-4000-8000-000000000081",
  userId: "d3000000-0000-4000-8000-000000000081",
});

// The isolated backend provisions this user id as platform admin (PLATFORM_ADMIN_USER_IDS).
const platformFixture = tenantFixture({
  tenant: "bcc-platform-a",
  email: "platform@bcc.test",
  password: "Fixture-Platform-2026!",
  roleId: "d2000000-0000-4000-8000-000000000082",
  userId: "7f9b2f7c-5ec4-4a67-8424-f0d20e89a693",
});

// Claims that were shown as measurements without any source.
const FABRICATED = [
  "99.98%",
  "4,192",
  "AI Confidence",
  "Predictive Churn Risk",
  "Market Live",
  "Live Shift",
  "Linking Modules",
];

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

// The badge carries a screen-reader reason after its visible label.
const previewBadges = (page) =>
  page.locator("span[title]").filter({ hasText: /^Önizleme/ });

// textContent, not innerText: the shell uppercases headings with CSS.
async function text(page) {
  return (await page.locator("main").textContent()) ?? "";
}

async function seriousAxe(page) {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async () => {
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
}

async function open(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "load" });
  await page
    .waitForLoadState("networkidle", { timeout: 8_000 })
    .catch(() => {});
  await page.waitForTimeout(1_000);
}

const admin = (route) => `/${TENANT}/admin/${route}`;

const STEPS = [
  [
    "brand header marks its sample telemetry",
    async (page) => {
      await open(page, admin("brand/intelligence"));
      const header = (await page.locator("main").first().textContent()) ?? "";
      expect(/Önizleme/.test(header), "telemetry badge missing");
    },
  ],
  [
    "the trajectory says there is not enough data instead of inventing one",
    async (page) => {
      const body = await text(page);
      expect(body.includes("Yeterli veri yok"), "no insufficient-data state");
      expect(
        !FABRICATED.some((claim) => body.includes(claim)),
        "fabricated claim on intelligence",
      );
    },
  ],
  [
    "module tiles: real event and ticket totals, no invented history or system claims",
    async (page) => {
      await open(page, admin("brand/module"));
      const body = await text(page);
      expect(
        body.includes("Etkinlik özeti") && body.includes("Yaklaşan etkinlik"),
        "events tile not built from stats",
      );
      expect(
        body.includes("SLA uyumu") && body.includes("Açık talep"),
        "support tile not built from stats",
      );
      expect(
        body.includes("platform bazında etkileşim geçmişi henüz toplanmıyor"),
        "social tile still draws a history",
      );
      expect(
        !FABRICATED.some((claim) => body.includes(claim)),
        "fabricated claim on module page",
      );
      const badges = await previewBadges(page).count();
      expect(badges >= 5, `sample tiles badged: ${badges}`);
    },
  ],
  [
    "resonance reports the real signal count",
    async (page) => {
      await open(page, admin("brand/resonance"));
      const body = await text(page);
      expect(
        /Son 10 dakikada (sinyal yok|\d+ sinyal)/.test(body),
        "signal status missing",
      );
      expect(
        (await previewBadges(page).count()) >= 2,
        "sample tiles on resonance not badged",
      );
    },
  ],
  [
    "strategy shows decision cards in order with tenant evidence",
    async (page) => {
      await open(page, admin("brand/strategy"));
      const cards = page.locator("article[aria-labelledby]");
      expect(
        (await cards.count()) === 2,
        `decision cards: ${await cards.count()}`,
      );
      const first = cards.first();
      // textContent, not innerText: CSS uppercase must not change what is compared.
      const firstText = (await first.textContent()) ?? "";
      const order = [
        "Onay bekliyor",
        "Açık destek",
        "Kanıt",
        "Ajan ata",
        "Ölçülen sonuç",
      ].map((t) => firstText.indexOf(t));
      expect(
        order.every((p, i) => p >= 0 && (i === 0 || p > order[i - 1])),
        `card order ${JSON.stringify(order)}`,
      );
      const href = await first.getByRole("link").first().getAttribute("href");
      expect(href === `/${TENANT}/admin/support`, `evidence link ${href}`);
      expect(
        ((await cards.nth(1).textContent()) ?? "").includes(
          "Sonuç henüz ölçülmedi",
        ),
        "applied card must not invent a result",
      );
    },
  ],
  [
    "approving a sample decision changes nothing and says so",
    async (page) => {
      const button = page.getByRole("button", { name: "Ajan ata" });
      expect(await button.isEnabled(), "tenant admin holds support.assign");
      await button.click();
      await page
        .getByText("bu kart hiçbir işlem yapmaz")
        .waitFor({ timeout: 5_000 });
    },
  ],
  [
    "brand pages have no serious axe violations at 375 and 1280 px",
    async (page) => {
      for (const route of [
        "brand/intelligence",
        "brand/module",
        "brand/resonance",
        "brand/strategy",
      ]) {
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await open(page, admin(route));
          const serious = await seriousAxe(page);
          expect(
            serious.length === 0,
            `${route}@${width}: ${serious.join(", ")}`,
          );
        }
        await page.waitForTimeout(PACE_MS);
      }
      await page.setViewportSize({ width: 1280, height: 900 });
    },
  ],
  [
    "platform console marks sample values",
    async (_page, browser) => {
      const console = await (
        await browser.newContext({ viewport: { width: 1280, height: 900 } })
      ).newPage();
      await platformFixture.login(console, BASE_URL);
      for (const route of [
        "/editorial-console",
        "/editorial-console/intelligence",
        "/editorial-console/security",
        "/editorial-console/modules",
      ]) {
        await open(console, route);
        expect(
          new URL(console.url()).pathname === route,
          `${route} redirected to ${console.url()}`,
        );
        const body = (await console.locator("body").textContent()) ?? "";
        expect(body.includes("Önizleme"), `${route} has no preview badge`);
        expect(
          !body.includes("Market Live") && !body.includes("Live Shift"),
          `${route} still claims live data`,
        );
      }
    },
  ],
];

(async () => {
  fixture.cleanup();
  platformFixture.cleanup();
  fixture.seed();
  platformFixture.seed();
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
      nativeDialogs.push(dialog.type());
      void dialog.dismiss();
    });
    await fixture.login(page, BASE_URL);
    for (const [name, run] of STEPS) {
      try {
        await run(page, browser);
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
      }
      await page.waitForTimeout(PACE_MS);
    }
  } finally {
    await browser.close();
    if (process.env.KEEP_FIXTURES !== "1") {
      fixture.cleanup();
      platformFixture.cleanup();
    }
  }
  console.log(`${passed}/${STEPS.length} steps passed`);
  process.exitCode = passed === STEPS.length ? 0 : 1;
})();
