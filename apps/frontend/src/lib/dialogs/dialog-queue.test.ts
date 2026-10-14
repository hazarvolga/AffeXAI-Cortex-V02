import assert from "node:assert/strict";
import { test } from "node:test";
import { createDialogQueue, type DialogRequest } from "./dialog-queue";

test("without a mounted host, confirm is false and prompt is null", async () => {
  const queue = createDialogQueue();
  assert.equal(await queue.confirm({ title: "Silinsin mi?" }), false);
  assert.equal(await queue.prompt({ title: "Ad", label: "Ad" }), null);
});

test("requests are shown one at a time, in order", async () => {
  const queue = createDialogQueue();
  const seen: Array<DialogRequest | null> = [];
  queue.subscribe((current) => seen.push(current));

  const first = queue.confirm({ title: "Birinci" });
  const second = queue.prompt({ title: "İkinci", label: "Değer" });
  assert.equal(queue.current()?.options.title, "Birinci");

  queue.settle(queue.current()!.id, true);
  assert.equal(queue.current()?.options.title, "İkinci");
  queue.settle(queue.current()!.id, "yanıt");

  assert.equal(await first, true);
  assert.equal(await second, "yanıt");
  assert.equal(queue.current(), null);
  assert.equal(seen.at(-1), null);
});

test("cancel resolves confirm to false and prompt to null", async () => {
  const queue = createDialogQueue();
  queue.subscribe(() => undefined);
  const confirm = queue.confirm({ title: "Sil", destructive: true });
  queue.settle(queue.current()!.id, false);
  const prompt = queue.prompt({ title: "Ad", label: "Ad" });
  queue.settle(queue.current()!.id, null);
  assert.equal(await confirm, false);
  assert.equal(await prompt, null);
});

test("settling an unknown id changes nothing", () => {
  const queue = createDialogQueue();
  queue.subscribe(() => undefined);
  void queue.confirm({ title: "Kalıyor" });
  queue.settle(999, true);
  assert.equal(queue.current()?.options.title, "Kalıyor");
});

test("unsubscribing the last host makes later requests answer safely", async () => {
  const queue = createDialogQueue();
  const off = queue.subscribe(() => undefined);
  off();
  assert.equal(await queue.confirm({ title: "x" }), false);
});
