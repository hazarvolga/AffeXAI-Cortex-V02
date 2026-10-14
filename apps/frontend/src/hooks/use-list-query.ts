"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseListQuery,
  serializeListQuery,
  type ListQueryDefaults,
  type ListQueryState,
} from "@/lib/list/list-query";

export interface ListQueryControls extends ListQueryState {
  setSearch: (q: string) => void;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
}

/**
 * List state backed by the URL (search, filters, page, page size). Search and
 * filter changes go back to page 1; `defaults` must be a stable module constant.
 */
export function useListQuery(defaults: ListQueryDefaults): ListQueryControls {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = params.toString();
  const state = useMemo(
    () => parseListQuery(new URLSearchParams(query), defaults),
    [query, defaults],
  );

  const commit = useCallback(
    (next: ListQueryState) => {
      const qs = serializeListQuery(next, defaults);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [defaults, pathname, router],
  );

  return {
    ...state,
    setSearch: (q) => commit({ ...state, q, page: 1 }),
    setPage: (page) => commit({ ...state, page }),
    setFilter: (key, value) =>
      commit({
        ...state,
        filters: { ...state.filters, [key]: value },
        page: 1,
      }),
  };
}
