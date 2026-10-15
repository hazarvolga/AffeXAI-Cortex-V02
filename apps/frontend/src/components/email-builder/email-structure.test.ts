import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendBlock,
  replaceBlock,
  type EmailStructure,
} from "./email-structure";

const empty: EmailStructure = { rows: [], settings: { contentWidth: "600px" } };
let counter = 0;
const makeId = () => `id-${++counter}`;

test("a block picked from the library is appended as a new full-width row with defaults", () => {
  const next = appendBlock(empty, "button", makeId);
  assert.equal(empty.rows.length, 0, "input is not mutated");
  assert.equal(next.rows.length, 1);
  const block = next.rows[0].columns[0].blocks[0];
  assert.equal(block.type, "button");
  assert.equal(next.rows[0].columns[0].width, "100%");
  assert.equal(block.properties.text, "Tıklayın");
  assert.ok(block.styles.backgroundColor);
});

test("unknown block types start empty instead of failing", () => {
  const block = appendBlock(empty, "html_code", makeId).rows[0].columns[0]
    .blocks[0];
  assert.deepEqual(block.properties, {});
});

test("an edited block replaces the block with the same id and nothing else", () => {
  const two = appendBlock(
    appendBlock(empty, "text", makeId),
    "heading",
    makeId,
  );
  const target = two.rows[1].columns[0].blocks[0];
  const next = replaceBlock(two, {
    ...target,
    properties: { ...target.properties, text: "Yeni" },
  });
  assert.equal(next.rows[1].columns[0].blocks[0].properties.text, "Yeni");
  assert.equal(next.rows[0], two.rows[0], "untouched rows keep identity");
  assert.equal(
    two.rows[1].columns[0].blocks[0].properties.text,
    "Başlık Metni",
    "input is not mutated",
  );
});
