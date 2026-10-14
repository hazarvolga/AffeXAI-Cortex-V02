import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, parseListQuery, serializeListQuery } from "./list-query";

const defaults = { pageSize: 25, filters: { status: "all" } };

test("missing or invalid params fall back to defaults", () => {
  const state = parseListQuery(
    new URLSearchParams("page=abc&pageSize=-3"),
    defaults,
  );
  assert.deepEqual(state, {
    q: "",
    page: 1,
    pageSize: 25,
    filters: { status: "all" },
  });
});

test("committed search, page, page size and known filters are read from the URL", () => {
  const state = parseListQuery(
    new URLSearchParams("q=ay%C5%9Fe&page=3&pageSize=50&status=active&x=1"),
    defaults,
  );
  assert.deepEqual(state, {
    q: "ayşe",
    page: 3,
    pageSize: 50,
    filters: { status: "active" },
  });
});

test("serializing drops default values so URLs stay short and shareable", () => {
  assert.equal(
    serializeListQuery(
      { q: "", page: 1, pageSize: 25, filters: { status: "all" } },
      defaults,
    ),
    "",
  );
  assert.equal(
    serializeListQuery(
      { q: " ayşe ", page: 2, pageSize: 25, filters: { status: "active" } },
      defaults,
    ),
    "q=ay%C5%9Fe&page=2&status=active",
  );
});

test("the page is clamped to the last page that still has rows", () => {
  assert.equal(clampPage(5, 51, 25), 3);
  assert.equal(clampPage(2, 0, 25), 1);
  assert.equal(clampPage(1, 10, 25), 1);
});
