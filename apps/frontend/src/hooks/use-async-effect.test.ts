import assert from "node:assert/strict";
import { test } from "node:test";
import { scheduleAfterCommit } from "./use-async-effect";

function manualScheduler() {
  const queue: Array<() => void> = [];
  return {
    schedule: (cb: () => void) => queue.push(cb),
    flush: () => queue.splice(0).forEach((cb) => cb()),
  };
}

test("the task runs after the commit, not synchronously", () => {
  const { schedule, flush } = manualScheduler();
  let runs = 0;
  scheduleAfterCommit(() => (runs += 1), schedule);
  assert.equal(runs, 0);
  flush();
  assert.equal(runs, 1);
});

test("cancelling before the flush skips the task entirely", () => {
  const { schedule, flush } = manualScheduler();
  let runs = 0;
  const cancel = scheduleAfterCommit(() => (runs += 1), schedule);
  cancel();
  flush();
  assert.equal(runs, 0);
});

test("a running task can see that it was cancelled later", async () => {
  const { schedule, flush } = manualScheduler();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let sawCancelled: boolean | undefined;
  const cancel = scheduleAfterCommit(async (run) => {
    await gate;
    sawCancelled = run.cancelled;
  }, schedule);
  flush();
  cancel();
  release();
  await gate;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sawCancelled, true);
});
