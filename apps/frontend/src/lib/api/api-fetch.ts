import { tenantFromPath } from "../auth/tenant-selection";
import { tokenStorage } from "../auth/token-storage";

interface SessionContext {
  token: string | null;
  tenant: string | undefined;
}

/** Same session headers httpClient sends; explicit caller headers always win. */
export function withSessionHeaders(
  init: HeadersInit | undefined,
  session: SessionContext,
): Headers {
  const headers = new Headers(init);
  if (session.token && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${session.token}`);
  if (session.tenant && !headers.has("x-tenant-id"))
    headers.set("x-tenant-id", session.tenant);
  return headers;
}

function currentSession(): SessionContext {
  if (typeof window === "undefined") return { token: null, tenant: undefined };
  return {
    token:
      window.localStorage.getItem("auth_token") ??
      tokenStorage.getAccessToken(),
    tenant: tenantFromPath(window.location.pathname),
  };
}

/**
 * `fetch` for the app's own API routes: adds the signed-in user's bearer token
 * and tenant selector, which plain `fetch('/api/…')` calls were missing (401).
 */
export function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: withSessionHeaders(init.headers, currentSession()),
  });
}

/** JSON body of an API response, unwrapping the backend `{ success, data }` envelope. */
export async function readApiData<T>(response: Response): Promise<T> {
  const body = (await response.json()) as unknown;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
