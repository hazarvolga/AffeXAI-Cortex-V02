import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Decision } from "./decision-model";

(globalThis as { React?: typeof React }).React = React;
const load = () => import("./DecisionCard");

const decision: Decision = {
  id: "d-1",
  recommendation: "Bekleyen talepler için bir ajan daha atayın.",
  evidence: [
    {
      label: "12 açık talep",
      href: "/acme/admin/support",
      date: "2026-10-14T09:00:00Z",
      tenant: "acme",
    },
  ],
  action: { label: "Ajan ata", permission: "tickets.assign" },
  status: "pending",
  outcome: null,
};

test("the card reads in order: status, recommendation, linked evidence, action, result", async () => {
  const { DecisionCard } = await load();
  const html = renderToStaticMarkup(
    <DecisionCard
      decision={decision}
      viewer={{ permissions: ["tickets.assign"], tenant: "acme" }}
      onApprove={() => {}}
    />,
  );
  const order = [
    "Onay bekliyor",
    "Bekleyen talepler",
    'href="/acme/admin/support"',
    "Ajan ata",
    "Ölçülen sonuç",
  ];
  const positions = order.map((text) => html.indexOf(text));
  assert.ok(
    positions.every((p) => p >= 0),
    JSON.stringify(positions),
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
  );
  assert.match(html, /<article aria-labelledby=/);
  assert.doesNotMatch(html, / disabled=""/);
});

test("without permission the action is disabled and described by the reason", async () => {
  const { DecisionCard } = await load();
  const html = renderToStaticMarkup(
    <DecisionCard
      decision={decision}
      viewer={{ permissions: [], tenant: "acme" }}
      onApprove={() => {}}
      isDemo
    />,
  );
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-describedby="[^"]+-reason"/);
  assert.match(html, /tickets\.assign/);
  assert.match(html, /Önizleme/);
});
