import {
  isTenantSelection,
  resolveLoginTarget,
  type LoginTarget,
} from "@/lib/auth/login-outcome";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/auth/session-keys";

// Get API URL from environment - server-side route can use internal URL
const getApiUrl = () => {
  // For server-side API routes, use BACKEND_URL (internal) or NEXT_PUBLIC_API_URL
  let apiUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:9006";

  // Force internal IPv4 addressing for reliability
  apiUrl = apiUrl.replace("localhost", "127.0.0.1");
  if (apiUrl.includes("::1")) {
    apiUrl = apiUrl.replace("::1", "127.0.0.1");
  }

  // Ensure URL ends with /api
  return apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
};

export async function POST(request: NextRequest) {
  try {
    // A workspace code selects the tenant login; without one the backend discovers it.
    let target: LoginTarget;
    try {
      target = resolveLoginTarget(request.headers.get("x-tenant-id"));
    } catch {
      return NextResponse.json(
        { error: "Geçerli bir çalışma alanı kodu girin." },
        { status: 400 },
      );
    }
    const body = await request.json();
    const { email, password } = body;

    const apiUrl = getApiUrl();

    // Call backend API
    const response = await fetch(`${apiUrl}${target.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...target.headers,
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    // Handle error responses
    if (!response.ok) {
      const errorMessage =
        responseData.error?.message ||
        responseData.message ||
        responseData.error ||
        "Login failed";

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    // Handle success: false responses (even with 200 status)
    if (responseData.success === false) {
      const errorMessage =
        responseData.error?.message ||
        responseData.message ||
        responseData.error ||
        "Login failed";

      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    // Backend wraps response in { success, data, meta } format
    const data = responseData.data || responseData;

    // Several workspaces accepted the password: no session yet, so no cookies.
    if (isTenantSelection(data)) {
      return NextResponse.json({
        requiresTenantSelection: true,
        tenants: data.tenants,
      });
    }

    if (!data.access_token) {
      return NextResponse.json(
        { error: "No access token received from server" },
        { status: 500 },
      );
    }

    // Set cookies server-side
    const cookieStore = await cookies();

    cookieStore.set("auth_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set(ACCESS_TOKEN_KEY, data.access_token, {
      httpOnly: false, // Client-side accessible for API calls
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookieStore.set("cortex_access_token", data.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    if (data.refresh_token) {
      cookieStore.set(REFRESH_TOKEN_KEY, data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      cookieStore.set("cortex_refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
