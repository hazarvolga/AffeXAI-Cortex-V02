import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as { React?: typeof React }).React = React;

test("the frame gives the page one main landmark and a skip link to it", async () => {
  const { AdminPageFrame } = await import("./AdminPageFrame");
  const html = renderToStaticMarkup(
    <AdminPageFrame>
      <h1>Başlık</h1>
    </AdminPageFrame>,
  );
  assert.equal((html.match(/<main/g) ?? []).length, 1);
  assert.match(html, /href="#tenant-main-content"[^>]*>Ana içeriğe geç</);
  assert.match(html, /<main id="tenant-main-content" tabindex="-1"/);
});

test("a module header sits between the skip link and main", async () => {
  const { AdminPageFrame } = await import("./AdminPageFrame");
  const html = renderToStaticMarkup(
    <AdminPageFrame header={<nav aria-label="Modül">x</nav>}>
      <h1>Başlık</h1>
    </AdminPageFrame>,
  );
  assert.ok(html.indexOf("Ana içeriğe geç") < html.indexOf("<nav"));
  assert.ok(html.indexOf("<nav") < html.indexOf("<main"));
});
