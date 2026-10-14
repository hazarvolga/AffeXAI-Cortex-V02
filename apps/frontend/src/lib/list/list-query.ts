/**
 * UX-CONTRACT "Veri kümesi navigasyonu": committed search, filters, page and
 * page size live in the URL. These pure helpers read and write that state.
 */

export interface ListQueryDefaults {
  pageSize: number;
  /** Known filter keys and their default values; unknown params are ignored. */
  filters: Record<string, string>;
}

export interface ListQueryState {
  q: string;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
}

const MAX_PAGE_SIZE = 100;

function positiveInt(
  raw: string | null,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
}

export function parseListQuery(
  params: URLSearchParams,
  defaults: ListQueryDefaults,
): ListQueryState {
  const filters = Object.fromEntries(
    Object.entries(defaults.filters).map(([key, fallback]) => [
      key,
      params.get(key) || fallback,
    ]),
  );
  return {
    q: params.get("q") ?? "",
    page: positiveInt(params.get("page"), 1),
    pageSize: positiveInt(
      params.get("pageSize"),
      defaults.pageSize,
      MAX_PAGE_SIZE,
    ),
    filters,
  };
}

export function serializeListQuery(
  state: ListQueryState,
  defaults: ListQueryDefaults,
): string {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) params.set("q", q);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.pageSize !== defaults.pageSize)
    params.set("pageSize", String(state.pageSize));
  for (const [key, fallback] of Object.entries(defaults.filters)) {
    const value = state.filters[key];
    if (value && value !== fallback) params.set(key, value);
  }
  return params.toString();
}

/** After a filter or delete, stay on the last page that still has rows. */
export function clampPage(
  page: number,
  total: number,
  pageSize: number,
): number {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, page), lastPage);
}
