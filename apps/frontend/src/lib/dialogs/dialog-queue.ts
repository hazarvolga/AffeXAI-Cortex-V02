/**
 * App-owned replacement for window.alert/confirm/prompt (UX-CONTRACT bans the
 * browser dialogs). Callers await a promise; <DialogHost/> renders one request
 * at a time with Radix alert-dialog. Without a mounted host the safe answer is
 * returned (false / null), so a destructive action never runs by default.
 */

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Destructive actions get the danger style and initial focus on Cancel. */
  destructive?: boolean;
}

export interface PromptOptions {
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  /** Rejects an empty answer with this message instead of resolving. */
  requiredMessage?: string;
}

export type DialogRequest =
  | {
      id: number;
      kind: "confirm";
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      id: number;
      kind: "prompt";
      options: PromptOptions;
      resolve: (value: string | null) => void;
    };

type Listener = (current: DialogRequest | null) => void;

export interface DialogQueue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  /** Settles the visible request and shows the next one. */
  settle: (id: number, value: boolean | string | null) => void;
  current: () => DialogRequest | null;
  subscribe: (listener: Listener) => () => void;
}

export function createDialogQueue(): DialogQueue {
  let pending: DialogRequest[] = [];
  let nextId = 1;
  const listeners = new Set<Listener>();

  const notify = () =>
    listeners.forEach((listener) => listener(pending[0] ?? null));
  const enqueue = (request: DialogRequest) => {
    pending = [...pending, request];
    notify();
  };

  return {
    confirm(options) {
      if (listeners.size === 0) return Promise.resolve(false);
      return new Promise((resolve) =>
        enqueue({ id: nextId++, kind: "confirm", options, resolve }),
      );
    },
    prompt(options) {
      if (listeners.size === 0) return Promise.resolve(null);
      return new Promise((resolve) =>
        enqueue({ id: nextId++, kind: "prompt", options, resolve }),
      );
    },
    settle(id, value) {
      const request = pending.find((item) => item.id === id);
      if (!request) return;
      pending = pending.filter((item) => item.id !== id);
      if (request.kind === "confirm") request.resolve(value === true);
      else request.resolve(typeof value === "string" ? value : null);
      notify();
    },
    current: () => pending[0] ?? null,
    subscribe(listener) {
      listeners.add(listener);
      listener(pending[0] ?? null);
      return () => listeners.delete(listener);
    },
  };
}

export const dialogQueue = createDialogQueue();

/** `if (!(await confirmDialog({ title }))) return;` replaces `if (!confirm(...)) return;` */
export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  dialogQueue.confirm(options);

/** Resolves to the entered text, or null when cancelled. */
export const promptDialog = (options: PromptOptions): Promise<string | null> =>
  dialogQueue.prompt(options);
