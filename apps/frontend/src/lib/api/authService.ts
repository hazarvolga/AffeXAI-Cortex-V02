import { tenantHeaders, tenantFromPath } from "../auth/tenant-selection";
import { httpClient } from "./http-client";
import {
  isTenantSelection,
  LoginError,
  type LoginOutcome,
} from "../auth/login-outcome";
import {
  LoginDto,
  LoginResponse,
  UserProfile,
  ApiResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  ChangePasswordDto,
} from "@affexai/shared-types";
import { SESSION_STORAGE_KEYS } from "@/lib/auth/session-keys";

export type {
  LoginDto,
  LoginResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  ChangePasswordDto,
};

export type CurrentUser = UserProfile & { tenantId?: string };

export type TenantLoginCredentials = LoginDto & { tenantId?: string };

export type { LoginOutcome } from "../auth/login-outcome";

class AuthService {
  /**
   * Login through the Next route (which sets the middleware cookies).
   * With a workspace code, or one taken from the URL, this is the tenant
   * login; without one the backend discovers the workspace. A selection
   * outcome carries no token and stores nothing.
   */
  async login(credentials: TenantLoginCredentials): Promise<LoginOutcome> {
    const tenant =
      credentials.tenantId?.trim() ||
      (typeof window !== "undefined"
        ? tenantFromPath(window.location.pathname)
        : undefined);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tenant ? tenantHeaders(tenant) : {}),
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Login failed" }));
      throw new LoginError(response.status, errorData.error || "Login failed");
    }

    const outcome: unknown = await response.json();
    if (isTenantSelection(outcome)) return outcome;

    const loginData = outcome as LoginResponse;
    if (!loginData.access_token) {
      throw new LoginError(500, "No access token received from server");
    }
    await this.storeSession(loginData);
    return loginData;
  }

  private async storeSession(loginData: LoginResponse): Promise<void> {
    httpClient.setAuthToken(loginData.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", loginData.access_token);
    }
    const { tokenStorage } = await import("../auth/token-storage");
    tokenStorage.setAccessToken(loginData.access_token);
    if (loginData.refresh_token)
      tokenStorage.setRefreshToken(loginData.refresh_token);
  }

  /**
   * Logout user and clear token
   */
  async logout(): Promise<void> {
    const tenantId =
      typeof window !== "undefined"
        ? this.getUserFromToken()?.tenantId ||
          tenantFromPath(window.location.pathname)
        : undefined;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: tenantHeaders(tenantId),
      });
    } finally {
      httpClient.clearAuthToken();
      const { tokenStorage } = await import("../auth/token-storage");
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        localStorage.removeItem("cortex_access_token");
        localStorage.removeItem("cortex_refresh_token");
        window.location.href = "/login";
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!httpClient.getAuthToken();
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return httpClient.getAuthToken();
  }

  /**
   * Decode JWT token and get user info (client-side only)
   * Note: This is NOT secure for permissions - only use for UI display
   */
  getUserFromToken():
    (Pick<CurrentUser, "id" | "email"> & Partial<CurrentUser>) | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      // JWT format: header.payload.signature
      const payload = token.split(".")[1];

      // JWT uses base64url encoding, need to convert to standard base64
      // Replace URL-safe characters: - with +, _ with /
      // Add padding if needed
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );

      const decoded = JSON.parse(atob(padded));

      return {
        id: decoded.sub || decoded.userId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        roleId: decoded.roleId,
        phone: decoded.phone,
        city: decoded.city,
        country: decoded.country,
        address: decoded.address,
        bio: decoded.bio,
        isActive: decoded.isActive ?? true,
        emailVerified: decoded.emailVerified ?? false,
        emailVerifiedAt: decoded.emailVerifiedAt,
        metadata: decoded.metadata,
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  /**
   * Get current user from API
   */
  async getCurrentUser(): Promise<CurrentUser> {
    return await httpClient.getWrapped<CurrentUser>("/auth/me");
  }

  /**
   * Update user token with fresh user data
   * Useful after profile updates to keep JWT in sync
   */
  updateUserToken(updatedUser: Partial<CurrentUser>): void {
    const currentToken = this.getToken();
    if (!currentToken) return;

    try {
      // Decode current token
      const payload = currentToken.split(".")[1];
      const decoded = JSON.parse(atob(payload));

      // Merge updated user data
      const newPayload = {
        ...decoded,
        ...updatedUser,
        // Ensure critical fields are preserved
        sub: updatedUser.id || decoded.sub,
        email: updatedUser.email || decoded.email,
      } as any as CurrentUser;

      // Note: In production, you should get a new token from the server
      // This is a client-side workaround for immediate UI updates
      // For security, consider calling backend to get a fresh token
      console.log(
        "⚠️ Token updated client-side. Consider refreshing from server for security.",
      );

      // For now, we'll just log. In production, call backend for new token
      // The UI will use getUserFromToken() which reads from the current token
    } catch (error) {
      console.error("Error updating token:", error);
    }
  }

  /**
   * Check if email already exists (duplicate check)
   */
  async checkEmailExists(
    email: string,
    tenantId?: string,
  ): Promise<{ exists: boolean; message: string }> {
    return await httpClient.postWrapped<{ exists: boolean; message: string }>(
      "/auth/check-email",
      { email },
      { headers: tenantHeaders(tenantId) },
    );
  }

  /**
   * Register new user
   */
  async register(
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
      metadata?: any;
    },
    tenantId?: string,
  ): Promise<{
    success: boolean;
    message: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }> {
    return await httpClient.postWrapped("/auth/register", userData, {
      headers: tenantHeaders(tenantId),
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    console.log("🔄 AuthService: Refreshing access token");
    const response = await httpClient.postWrapped<RefreshTokenResponse>(
      "/auth/refresh",
      dto,
    );

    // Store new tokens
    if (response.access_token) {
      httpClient.setAuthToken(response.access_token);

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token);
      }

      try {
        const { tokenStorage } = await import("../auth/token-storage");
        tokenStorage.setAccessToken(response.access_token);

        if (response.refresh_token) {
          tokenStorage.setRefreshToken(response.refresh_token);
        }
        console.log("✅ AuthService: Tokens refreshed and stored");
      } catch (error) {
        console.error("Error storing refreshed tokens:", error);
      }
    }

    return response;
  }

  /**
   * Change password
   */
  async changePassword(
    data: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return await httpClient.postWrapped<{ success: boolean; message: string }>(
      "/auth/change-password",
      data,
    );
  }

  async requestPasswordReset(
    email: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    return await httpClient.postWrapped(
      "/auth/forgot-password",
      { email },
      { headers: tenantHeaders(tenantId) },
    );
  }

  async resetPassword(
    token: string,
    newPassword: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    return await httpClient.postWrapped(
      "/auth/reset-password",
      { token, newPassword },
      { headers: tenantHeaders(tenantId) },
    );
  }

  async acceptInvitation(
    token: string,
    newPassword: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    return await httpClient.postWrapped(
      "/auth/invitations/accept",
      { token, newPassword },
      { headers: tenantHeaders(tenantId) },
    );
  }
}

export const authService = new AuthService();
