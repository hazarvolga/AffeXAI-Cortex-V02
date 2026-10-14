import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// tsx compiles JSX with the classic runtime; Next uses the automatic one.
(globalThis as { React?: typeof React }).React = React;
const load = () => import("./demo-data-badge");

test("the badge says demo data in words, not only with colour", async () => {
  const { DemoDataBadge } = await load();
  const html = renderToStaticMarkup(<DemoDataBadge />);
  assert.match(html, /Demo veri/);
  assert.match(
    html,
    /title="Bu alandaki değerler gerçek kayıtlardan gelmiyor\."/,
  );
});

test("a preview badge can name its own reason", async () => {
  const { DemoDataBadge } = await load();
  const html = renderToStaticMarkup(
    <DemoDataBadge
      label="Önizleme"
      reason="Strateji önerileri henüz kaynak kayıtlara bağlı değil."
    />,
  );
  assert.match(html, /Önizleme/);
  assert.match(html, /kaynak kayıtlara bağlı değil/);
});
