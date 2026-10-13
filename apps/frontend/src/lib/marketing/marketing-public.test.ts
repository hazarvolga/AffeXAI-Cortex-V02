import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicCopy, type PublicCopy } from "../i18n/public-copy";
import { earlyAccessMailto } from "./contact";
import {
  MODULE_ACCEPTANCE,
  publicStatusOf,
  type MarketedModule,
} from "./module-status";

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
