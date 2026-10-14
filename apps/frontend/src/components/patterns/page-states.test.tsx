import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// tsx compiles JSX with the classic runtime; Next uses the automatic one.
(globalThis as { React?: typeof React }).React = React;
const load = () => import("./page-states");

test("page header renders one h1 and the primary action", async () => {
  const { PageHeader } = await load();
  const html = renderToStaticMarkup(
    <PageHeader
      title="Müşteriler"
      description="Tüm CRM kayıtları"
      actions={<button>Yeni müşteri</button>}
    />,
  );
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /Müşteriler/);
  assert.match(html, /Yeni müşteri/);
});

test("empty and no-results states are polite status regions with a next step", async () => {
  const { EmptyState, NoResultsState } = await load();
  for (const State of [EmptyState, NoResultsState]) {
    const html = renderToStaticMarkup(
      <State
        title="Henüz kayıt yok"
        action={<button>İlk kaydı oluştur</button>}
      />,
    );
    assert.match(html, /role="status"/);
    assert.match(html, /İlk kaydı oluştur/);
  }
});

test("error state is an alert so screen readers announce it", async () => {
  const { ErrorState } = await load();
  const html = renderToStaticMarkup(
    <ErrorState title="Yüklenemedi" action={<button>Yeniden dene</button>} />,
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /Yeniden dene/);
});

test("optional parts are omitted when not given", async () => {
  const { EmptyState } = await load();
  const html = renderToStaticMarkup(<EmptyState title="Boş" />);
  assert.doesNotMatch(html, /<p/);
});
