import { useEffect, type DependencyList } from "react";

export interface EffectRun {
  /** True once the component unmounted or the dependencies changed. */
  readonly cancelled: boolean;
}

/**
 * Schedules `task` after the current commit instead of running it inside the
 * effect body, and returns a canceller. Pure, so it can be tested without React.
 */
export function scheduleAfterCommit(
  task: (run: EffectRun) => unknown,
  schedule: (callback: () => void) => void = queueMicrotask,
): () => void {
  const run = { cancelled: false };
  schedule(() => {
    if (!run.cancelled) void task(run);
  });
  return () => {
    run.cancelled = true;
  };
}

/**
 * For data loading on mount or when `deps` change. Loaders may set loading
 * state immediately; running them after the commit keeps the effect body free
 * of synchronous setState (no cascading renders), and `run.cancelled` lets a
 * loader skip state updates after unmount.
 */
export function useAsyncEffect(
  task: (run: EffectRun) => unknown,
  deps: DependencyList,
): void {
  // The caller owns `deps`, exactly like useEffect; the task is read fresh on each change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => scheduleAfterCommit(task), deps);
}
