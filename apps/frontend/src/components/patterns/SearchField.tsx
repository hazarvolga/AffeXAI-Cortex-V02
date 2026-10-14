"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const SEARCH_DEBOUNCE_MS = 300;

export interface SearchFieldProps {
  label: string;
  /** The committed query (usually from the URL). */
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  /** Announced politely after each committed search, e.g. "12 sonuç". */
  resultSummary?: string;
  className?: string;
}

/**
 * UX-CONTRACT search: persistent label, clear control, 300 ms debounce that
 * waits for IME composition to finish, and a live result count.
 */
export function SearchField({
  label,
  value,
  onCommit,
  placeholder,
  resultSummary,
  className,
}: SearchFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);
  const composing = useRef(false);
  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  // Follow external changes (back/forward, "clear filters") without a cascading effect.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  useEffect(() => {
    if (composing.current || debounced.trim() === value.trim()) return;
    onCommit(debounced);
  }, [debounced, onCommit, value]);

  return (
    <div className={cn("w-full sm:max-w-sm", className)}>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-white/75"
      >
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
        />
        <input
          id={id}
          type="search"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            setDraft(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCommit(draft);
          }}
          className="h-10 w-full rounded-md border border-white/15 bg-black/40 pl-9 pr-10 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {draft && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onCommit("");
            }}
            className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X aria-hidden className="h-4 w-4" />
            <span className="sr-only">Aramayı temizle</span>
          </button>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-1 min-h-4 text-xs text-white/60"
      >
        {resultSummary}
      </p>
    </div>
  );
}
