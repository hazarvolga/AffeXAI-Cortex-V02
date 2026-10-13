import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { LEGACY_MARKETING_REDIRECTS } from "../../../next.config";
import {
  fillTemplate,
  getPublicCopy,
  type PublicCopy,
} from "../i18n/public-copy";
import { earlyAccessMailto } from "./contact";
import { MODULE_GROUPS } from "./module-catalog";
import {
  ALL_MODULES,
  MODULE_ACCEPTANCE,
  MODULE_COUNT,
  publicStatusOf,
  tallyPublicStatuses,
  type MarketedModule,
} from "./module-status";
import {
  MARKETING_PAGES,
  earlyAccessFormPath,
  languageAlternates,
  marketingPath,
} from "./routes";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function emptyLeaves(copy: PublicCopy): string[] {
  const walk = (value: unknown, path: string): string[] => {
    if (typeof value === "string") return value.trim() ? [] : [path];
    if (Array.isArray(value))
      return value.flatMap((item, i) => walk(item, `${path}[${i}]`));
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      walk(v, `${path}.${k}`),
    );
  };
  return walk(copy, "copy");
}

test("Turkish and English public copy expose the same keys and list lengths", () => {
  assert.deepEqual(
    leafPaths(getPublicCopy("en")),
    leafPaths(getPublicCopy("tr")),
  );
});

test("public copy has no empty strings in either locale", () => {
  assert.deepEqual(emptyLeaves(getPublicCopy("tr")), []);
  assert.deepEqual(emptyLeaves(getPublicCopy("en")), []);
});

test("Turkish is the default public locale", () => {
  assert.equal(getPublicCopy(), getPublicCopy("tr"));
});

test("marketing never shows a module ahead of its acceptance status", () => {
  const pending = (Object.keys(MODULE_ACCEPTANCE) as MarketedModule[]).filter(
    (name) => MODULE_ACCEPTANCE[name] === "Bekliyor",
  );
  for (const name of pending)
    assert.equal(publicStatusOf(name), "roadmap", name);
  assert.equal(publicStatusOf("tickets"), "in-development");
  assert.equal(publicStatusOf("crm"), "early-access");
  assert.equal(publicStatusOf("strategy"), "roadmap");
  assert.equal(publicStatusOf("commerce"), "roadmap");
});

test("early-access mailto encodes the Turkish subject line", () => {
  assert.equal(
    earlyAccessMailto("info@affexai.tr"),
    "mailto:info@affexai.tr?subject=Erken%20eri%C5%9Fim%20talebi",
  );
});

const MATRIX_PATH = join(
  process.cwd(),
  "../../docs/active/AffeXAI-Cortex_Modul_Kabul_Matrisi.md",
);

test("module statuses mirror the acceptance matrix exactly", () => {
  const rows = readFileSync(MATRIX_PATH, "utf8").matchAll(
    /^\| \*\*([a-z-]+)\*\* — ([^|]+?) \|/gm,
  );
  const matrix = Object.fromEntries(
    [...rows].map(([, name, status]) => [name, status.trim()]),
  );
  assert.deepEqual(matrix, { ...MODULE_ACCEPTANCE });
  assert.equal(MODULE_COUNT, 33);
});

test("every module appears in exactly one public catalog group", () => {
  const listed = MODULE_GROUPS.flatMap((group) =>
    group.modules.map((entry) => entry.key),
  );
  assert.equal(new Set(listed).size, listed.length);
  assert.deepEqual([...listed].sort(), [...ALL_MODULES].sort());
});

test("the status tally covers all modules", () => {
  const tally = tallyPublicStatuses();
  assert.equal(
    tally["early-access"] + tally["in-development"] + tally.roadmap,
    MODULE_COUNT,
  );
});

test("legacy marketing URLs redirect to live Turkish pages", () => {
  const turkishPaths = new Set(
    MARKETING_PAGES.map((page) => marketingPath("tr", page)),
  );
  for (const redirect of LEGACY_MARKETING_REDIRECTS) {
    assert.ok(turkishPaths.has(redirect.destination), redirect.destination);
  }
});

test("English pages live under /en and every page has hreflang alternates", () => {
  for (const page of MARKETING_PAGES) {
    assert.match(marketingPath("en", page), /^\/en(\/|$)/);
    const alternates = languageAlternates(page);
    assert.equal(alternates["x-default"], alternates.tr);
  }
  assert.equal(earlyAccessFormPath("tr"), "/erken-erisim#basvuru");
});

test("templates fill named placeholders and keep unknown ones visible", () => {
  assert.equal(fillTemplate("{a} / {b}", { a: 5 }), "5 / {b}");
});
