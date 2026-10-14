import type { ReactNode } from "react";
import { toast as baseToast } from "@/hooks/use-toast";

/**
 * The single notification API (UX-CONTRACT: one accessible toast owner).
 * Mirrors the subset of `sonner` the app used, but renders through
 * components/ui/toast + hooks/use-toast, which the root layout mounts.
 * Sonner's own <Toaster> was never mounted, so those toasts were invisible.
 */

export interface NotifyOptions {
  description?: ReactNode;
  /** Re-using an id updates that toast instead of stacking a new one. */
  id?: string | number;
  duration?: number;
}

type Variant = "default" | "destructive";

interface ToastPayload {
  title?: ReactNode;
  description?: ReactNode;
  variant?: Variant;
  duration?: number;
}

interface ToastHandle {
  id: string;
  dismiss: () => void;
  update: (payload: ToastPayload & { id: string }) => void;
}

export type BaseToast = (payload: ToastPayload) => ToastHandle;

interface PromiseMessages<T> {
  loading: ReactNode;
  success: ReactNode | ((value: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
}

export interface Notifier {
  success: (title: ReactNode, options?: NotifyOptions) => string;
  error: (title: ReactNode, options?: NotifyOptions) => string;
  info: (title: ReactNode, options?: NotifyOptions) => string;
  warning: (title: ReactNode, options?: NotifyOptions) => string;
  message: (title: ReactNode, options?: NotifyOptions) => string;
  loading: (title: ReactNode, options?: NotifyOptions) => string;
  dismiss: (id?: string | number) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: NotifyOptions,
  ) => Promise<T>;
}

export function createNotifier(base: BaseToast): Notifier {
  const open = new Map<string, ToastHandle>();

  const show = (
    variant: Variant,
    title: ReactNode,
    options: NotifyOptions = {},
  ): string => {
    const key = options.id === undefined ? undefined : String(options.id);
    const payload: ToastPayload = {
      title,
      description: options.description,
      variant,
      duration: options.duration,
    };
    const existing = key ? open.get(key) : undefined;
    if (existing) {
      existing.update({ ...payload, id: existing.id });
      return key as string;
    }
    const handle = base(payload);
    open.set(key ?? handle.id, handle);
    return key ?? handle.id;
  };

  const dismiss = (id?: string | number) => {
    if (id === undefined) {
      open.forEach((handle) => handle.dismiss());
      open.clear();
      return;
    }
    const key = String(id);
    open.get(key)?.dismiss();
    open.delete(key);
  };

  const resolve = <A>(
    message: ReactNode | ((arg: A) => ReactNode),
    arg: A,
  ): ReactNode =>
    typeof message === "function"
      ? (message as (arg: A) => ReactNode)(arg)
      : message;

  return {
    success: (title, options) => show("default", title, options),
    error: (title, options) => show("destructive", title, options),
    info: (title, options) => show("default", title, options),
    warning: (title, options) => show("default", title, options),
    message: (title, options) => show("default", title, options),
    loading: (title, options) => show("default", title, options),
    dismiss,
    async promise(promise, messages, options = {}) {
      const id = show("default", messages.loading, options);
      try {
        const value = await promise;
        show("default", resolve(messages.success, value), { ...options, id });
        return value;
      } catch (error) {
        show("destructive", resolve(messages.error, error), { ...options, id });
        throw error;
      }
    },
  };
}

export const toast: Notifier = createNotifier(
  baseToast as unknown as BaseToast,
);
