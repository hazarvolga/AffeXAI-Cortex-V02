import assert from "node:assert/strict";
import { test } from "node:test";
import { filterTickets, type FilterableTicket } from "./ticket-filters";

const tickets: FilterableTicket[] = [
  {
    id: "t-1",
    subject: "Fatura hatası",
    description: "Ekim faturası",
    status: "open",
    priority: "high",
  },
  {
    id: "t-2",
    subject: "Giriş sorunu",
    description: undefined,
    status: "resolved",
    priority: "low",
  },
  {
    id: "t-3",
    subject: "Rapor",
    description: "Fatura dışa aktarımı",
    status: "open",
    priority: "low",
  },
];

test("'all' keeps every ticket", () => {
  assert.equal(
    filterTickets(tickets, { status: "all", priority: "all", query: "" })
      .length,
    3,
  );
});

test("status and priority narrow the list together", () => {
  const result = filterTickets(tickets, {
    status: "open",
    priority: "low",
    query: "",
  });
  assert.deepEqual(
    result.map((t) => t.id),
    ["t-3"],
  );
});

test("search matches subject, description or id, ignoring case and Turkish casing", () => {
  assert.deepEqual(
    filterTickets(tickets, {
      status: "all",
      priority: "all",
      query: "FATURA",
    }).map((t) => t.id),
    ["t-1", "t-3"],
  );
  assert.deepEqual(
    filterTickets(tickets, {
      status: "all",
      priority: "all",
      query: "GİRİŞ",
    }).map((t) => t.id),
    ["t-2"],
  );
  assert.deepEqual(
    filterTickets(tickets, {
      status: "all",
      priority: "all",
      query: " t-2 ",
    }).map((t) => t.id),
    ["t-2"],
  );
});
