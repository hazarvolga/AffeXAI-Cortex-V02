import { applyResponseCachePolicy } from "./lib/api/response-cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedLoginPath } from "./lib/auth/admin-login-routing";
import { isReservedTenantSlug } from "@affexai/shared-types";
import { createSessionValidationCache } from "./lib/auth/session-validation-cache";
import {
  legacyAdminTarget,
  tokenTenant,
} from "./lib/auth/legacy-admin-redirect";
import { readAccessToken } from "./lib/auth/session-keys";

/**
 * Middleware for authentication, authorization, and optimizations
 *
 * This middleware runs on every request and:
 * - Validates authentication for protected routes
 * - Checks role-based permissions
 * - Adds optimization headers for performance and security
 */
type BackendAuthResult = "valid" | "invalid" | "unavailable";

const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_CACHE_MAX_ENTRIES = 1_000;
const validatedSessions = createSessionValidationCache({
  ttlMs: SESSION_CACHE_TTL_MS,
  maxEntries: SESSION_CACHE_MAX_ENTRIES,
});

/** Validate the session at the backend, which alone owns the JWT signing key. */
async function validateAuthToken(token: string): Promise<BackendAuthResult> {
  if (await validatedSessions.isFresh(token)) return "valid";
  const result = await validateAuthTokenAtBackend(token);
  if (result === "valid") await validatedSessions.remember(token);
  return result;
}

async function validateAuthTokenAtBackend(
  token: string,
): Promise<BackendAuthResult> {
  const configuredBackendUrl = process.env.BACKEND_URL;
  if (!configuredBackendUrl) {
    console.error("🔐 Middleware: BACKEND_URL is not configured");
    return "unavailable";
  }

  const backendBaseUrl = configuredBackendUrl
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

  try {
    const response = await fetch(`${backendBaseUrl}/api/auth/me`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (response.ok) return "valid";
    if (response.status === 401 || response.status === 403) return "invalid";

    console.error(
      `🔐 Middleware: Backend token validation returned ${response.status}`,
    );
    return "unavailable";
  } catch (error) {
    console.error("🔐 Middleware: Backend token validation failed:", error);
    return "unavailable";
  }
}

export async function middleware(request: NextRequest) {
  // Get request path
  const path = request.nextUrl.pathname;

  // ============================================================================
  // Route Redirects
  // ============================================================================

  // Redirect old newsletter routes to email-marketing
  if (path.startsWith("/admin/newsletter")) {
    const newPath = path.replace("/admin/newsletter", "/admin/email-marketing");
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }

  // ============================================================================
  // Authentication & Authorization
  // ============================================================================

  // Check if route requires authentication
  const pathSegments = path.split("/");
  // Reserved first segments (admin, portal, api, the /en locale, ...) are never tenants.
  const isTenantRoute =
    pathSegments.length > 2 && !isReservedTenantSlug(pathSegments[1]);

  // Normalized path for check (remove tenant prefix if present)
  const normalizedPath = isTenantRoute
    ? "/" + pathSegments.slice(2).join("/")
    : path;

  const publicAdminRoutes = [
    "/admin/login",
    "/admin/signup",
    "/admin/forgot-password",
    "/admin/unauthorized",
  ];
  const isAdminRoute =
    normalizedPath.startsWith("/admin") &&
    !publicAdminRoutes.some((route) => normalizedPath.startsWith(route));
  const isPortalRoute = normalizedPath.startsWith("/portal");
  const requiresAuth = isAdminRoute || isPortalRoute;
  const tenantSlug = isTenantRoute ? pathSegments[1] : undefined;

  const createLoginRedirect = () => {
    const loginUrl = new URL(
      protectedLoginPath(isAdminRoute, tenantSlug),
      request.url,
    );
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  };

  const createAuthUnavailableResponse = () => {
    const response = NextResponse.json(
      {
        success: false,
        error: "Authentication service temporarily unavailable",
      },
      { status: 503 },
    );
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Retry-After", "5");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  };

  if (requiresAuth) {
    // Get auth token from cookies or headers
    const authToken =
      readAccessToken((name) => request.cookies.get(name)?.value) ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    // No token = redirect to login
    if (!authToken) {
      console.log("🔐 Middleware: No auth token, redirecting to login");
      return createLoginRedirect();
    }

    // The frontend never receives the backend JWT signing secret. Validate the
    // bearer with the backend and fail closed when validation is unavailable.
    const authResult = await validateAuthToken(authToken);
    if (authResult === "invalid") {
      console.error(`🔐 Middleware: Token rejected for ${path}`);
      return createLoginRedirect();
    }
    if (authResult === "unavailable") return createAuthUnavailableResponse();

    // F3.7: the legacy /admin tree is retired for users with a workspace. 307, not
    // 308: the target depends on who is signed in, so browsers must not cache it.
    if (isAdminRoute && !isTenantRoute) {
      const target = legacyAdminTarget(path, tokenTenant(authToken));
      if (target) {
        return NextResponse.redirect(
          new URL(`${target}${request.nextUrl.search}`, request.url),
          307,
        );
      }
    }

    console.log(`✅ Middleware: Session authenticated for ${path}`);
  }

  // ============================================================================
  // Response Headers & Optimization
  // ============================================================================

  const response = NextResponse.next();

  // Security headers (applied to all routes)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  applyResponseCachePolicy(response.headers, path);

  return response;
}

/**
 * Middleware configuration
 *
 * Specify which routes should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
