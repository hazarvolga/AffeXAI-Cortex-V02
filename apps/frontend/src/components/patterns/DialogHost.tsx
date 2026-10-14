"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { dialogQueue, type DialogRequest } from "@/lib/dialogs/dialog-queue";

const DEFAULT_CONFIRM = "Onayla";
const DEFAULT_CANCEL = "Vazgeç";

/** Mounted once in the root layout; renders confirmDialog / promptDialog requests. */
export function DialogHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  useEffect(() => dialogQueue.subscribe(setRequest), []);

  if (!request) return null;
  const close = (value: boolean | string | null) =>
    dialogQueue.settle(request.id, value);

  return (
    <AlertDialog
      open
      onOpenChange={(open) =>
        !open && close(request.kind === "confirm" ? false : null)
      }
    >
      <AlertDialogContent>
        {request.kind === "confirm" ? (
          <ConfirmBody request={request} onClose={close} />
        ) : (
          <PromptBody key={request.id} request={request} onClose={close} />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface BodyProps<K extends DialogRequest["kind"]> {
  request: Extract<DialogRequest, { kind: K }>;
  onClose: (value: boolean | string | null) => void;
}

function ConfirmBody({ request, onClose }: BodyProps<"confirm">) {
  const { title, description, confirmText, cancelText, destructive } =
    request.options;
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter>
        {/* Serious outcomes start with focus on the safe choice (UX-CONTRACT). */}
        <AlertDialogCancel
          autoFocus={destructive}
          onClick={() => onClose(false)}
        >
          {cancelText ?? DEFAULT_CANCEL}
        </AlertDialogCancel>
        <Button
          variant={destructive ? "destructive" : "default"}
          autoFocus={!destructive}
          onClick={() => onClose(true)}
        >
          {confirmText ?? DEFAULT_CONFIRM}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function PromptBody({ request, onClose }: BodyProps<"prompt">) {
  const {
    title,
    description,
    label,
    defaultValue,
    placeholder,
    confirmText,
    cancelText,
    requiredMessage,
  } = request.options;
  const [value, setValue] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const inputId = `dialog-prompt-${request.id}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (requiredMessage && !value.trim()) {
      setError(requiredMessage);
      return;
    }
    onClose(value);
  };

  return (
    <form onSubmit={submit} noValidate>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <div className="my-4">
        <label htmlFor={inputId} className="block text-sm font-medium">
          {label}
        </label>
        <input
          id={inputId}
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel type="button" onClick={() => onClose(null)}>
          {cancelText ?? DEFAULT_CANCEL}
        </AlertDialogCancel>
        <Button type="submit">{confirmText ?? DEFAULT_CONFIRM}</Button>
      </AlertDialogFooter>
    </form>
  );
}
