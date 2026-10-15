import assert from "node:assert/strict";
import { test } from "node:test";
import {
  editorSnapshot,
  fromStoredComponent,
  planComponentSync,
  remapComponentIds,
  toComponentDto,
} from "./page-persistence";

const hero = {
  id: "local-1",
  type: "hero-split",
  props: { title: "Merhaba" },
  orderIndex: 0,
};
const text = {
  id: "srv-2",
  type: "text",
  props: { content: "x" },
  orderIndex: 1,
};

test("stored prebuilt blocks come back with their block id as the editor type", () => {
  assert.deepEqual(
    fromStoredComponent({
      id: "s",
      type: "block",
      blockId: "hero-split",
      props: {},
    }),
    { id: "s", type: "hero-split", blockId: "hero-split", props: {} },
  );
  // Older rows kept the block id inside props.
  assert.equal(
    fromStoredComponent({ id: "s", type: "block", props: { blockId: "faq" } })
      .type,
    "faq",
  );
  assert.equal(
    fromStoredComponent({ id: "s", type: "text", props: {} }).type,
    "text",
  );
});

test("prebuilt blocks are stored as type block with a root block id", () => {
  assert.deepEqual(toComponentDto(hero, "p-1"), {
    pageId: "p-1",
    parentId: null,
    type: "block",
    blockId: "hero-split",
    props: { title: "Merhaba" },
    orderIndex: 0,
  });
  assert.equal(toComponentDto(text, "p-1").type, "text");
  assert.equal(toComponentDto(text, "p-1").blockId, undefined);
});

test("sync removes stored rows the editor dropped, updates known ones and creates the rest", () => {
  const plan = planComponentSync([hero, text], ["srv-2", "srv-3"]);
  assert.deepEqual(plan.remove, ["srv-3"]);
  assert.deepEqual(
    plan.update.map((c) => c.id),
    ["srv-2"],
  );
  assert.deepEqual(
    plan.create.map((c) => c.id),
    ["local-1"],
  );
});

test("created ids replace local ids so the next save updates instead of re-creating", () => {
  const remapped = remapComponentIds(
    [hero, text],
    new Map([["local-1", "srv-9"]]),
  );
  assert.deepEqual(
    remapped.map((c) => c.id),
    ["srv-9", "srv-2"],
  );
  assert.notEqual(remapped[0], hero, "returns new objects");
  assert.equal(hero.id, "local-1", "input is not mutated");
});

test("the snapshot changes with content or page settings and ignores selection-only fields", () => {
  const meta = {
    title: "A",
    slug: "a",
    description: "",
    showHeader: true,
    showFooter: true,
    fullWidth: false,
    categoryId: null,
  };
  const base = editorSnapshot([hero], meta);
  assert.equal(editorSnapshot([{ ...hero }], meta), base);
  assert.notEqual(
    editorSnapshot([{ ...hero, props: { title: "Selam" } }], meta),
    base,
  );
  assert.notEqual(editorSnapshot([hero], { ...meta, slug: "b" }), base);
  assert.equal(editorSnapshot([{ ...hero, locked: true }], meta), base);
});
