import { applyResponseCachePolicy } from "./lib/api/response-cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessRoute, UserRole } from "@/lib/permissions/constants";
import { protectedLoginPath } from "./lib/auth/admin-login-routing";

/**
 * Middleware for authentication, authorization, and optimizations
 *
 * This middleware runs on every request and:
 * - Validates authentication for protected routes
 * - Checks role-based permissions
 * - Adds optimization headers for performance and security
 */
/**
 * Token verification with structural + expiry checks.
 *
 * Güvenlik notu:
 * - İmza (HMAC-SHA256) doğrulaması YALNIZCA process.env.JWT_SECRET açıkça
 *   tanımlıysa yapılır. Backend ile aynı secret paylaşılmak zorundadır;
 *   frontend'de secret yoksa imza doğrulaması login döngüsüne yol açabilir,
 *   bu yüzden o durumda yalnızca yapı + exp kontrolü uygulanır (bugünkü
 *   davranıştan daha sıkı: bozuk/süresi dolmuş token'lar reddedilir).
 * - Asıl yetkilendirme backend'de (JwtAuthGuard) yapılır; bu kontrol
 *   erken reddetme (defense-in-depth) katmanıdır.
 */
type TokenVerification =
  { ok: true; payload: Record<string, any> } | { ok: false; reason: string };

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Length-independent string comparison (timing-attack resistant). */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyAuthToken(token: string): Promise<TokenVerification> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string };
  let payload: Record<string, any>;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64)));
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64)),
    );
  } catch {
    return { ok: false, reason: "unparsable-claims" };
  }

  if (header.alg !== "HS256") {
    return { ok: false, reason: `unsupported-alg:${header.alg}` };
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const mac = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${headerB64}.${payloadB64}`),
      );
      if (
        !constantTimeEquals(bytesToBase64Url(new Uint8Array(mac)), signatureB64)
      ) {
        return { ok: false, reason: "bad-signature" };
      }
    } catch {
      return { ok: false, reason: "verify-error" };
    }
  }

  return { ok: true, payload };
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
  const isTenantRoute =
    pathSegments.length > 2 &&
    pathSegments[1] !== "admin" &&
    pathSegments[1] !== "portal" &&
    pathSegments[1] !== "api";

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

  if (requiresAuth) {
    // Get auth token from cookies or headers
    const authToken =
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("aluplan_access_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    // No token = redirect to login
    if (!authToken) {
      console.log("🔐 Middleware: No auth token, redirecting to login");
      return createLoginRedirect();
    }

    // Token must exist, be structurally valid, unexpired and (when
    // JWT_SECRET is configured) correctly signed.
    try {
      const verified = await verifyAuthToken(authToken);

      if (!verified.ok) {
        console.error(
          `🔐 Middleware: Token rejected (${verified.reason}) for ${path}`,
        );
        return createLoginRedirect();
      }

      console.log(
        `✅ Middleware: User ${verified.payload.email ?? "unknown"} authenticated for ${path}`,
      );

      // Note: Role-based access control is now handled in layouts:
      // - portal/layout.tsx: Redirects Editor/Support to /admin
      // - admin/layout.tsx: Could redirect end-users to /portal (if needed)
      // This ensures fresh role data from backend instead of stale JWT data
    } catch (error) {
      console.error("🔐 Middleware: Token verification failed:", error);
      // Invalid token = redirect to login
      return createLoginRedirect();
    }
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
