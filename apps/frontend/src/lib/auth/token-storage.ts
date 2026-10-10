/**
 * Token Storage Service
 * 
 * Manages secure storage and retrieval of authentication tokens.
 * Uses localStorage for persistent sessions and sessionStorage for temporary sessions.
 */

// ============================================================================
// Types
// ============================================================================

export type StorageType = 'localStorage' | 'sessionStorage';

export interface TokenStorageConfig {
  accessTokenKey: string;
  refreshTokenKey: string;
  storageType: StorageType;
}

// ============================================================================
// Token Storage Class
// ============================================================================

/**
 * Token Storage Service
 */
export class TokenStorage {
  private config: TokenStorageConfig;
  private storage: Storage | null = null;

  constructor(config?: Partial<TokenStorageConfig>) {
    this.config = {
      accessTokenKey: config?.accessTokenKey || 'aluplan_access_token',
      refreshTokenKey: config?.refreshTokenKey || 'aluplan_refresh_token',
      storageType: config?.storageType || 'localStorage',
    };

    // Initialize storage (client-side only)
    if (typeof window !== 'undefined') {
      this.storage =
        this.config.storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    }
  }

  // ==========================================================================
  // Access Token Methods
  // ==========================================================================

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    if (!this.storage) return null;
    return this.storage.getItem(this.config.accessTokenKey);
  }

  /**
   * Set access token in storage
   */
  setAccessToken(token: string): void {
    if (!this.storage) return;
    this.storage.setItem(this.config.accessTokenKey, token);
  }

  /**
   * Remove access token from storage
   */
  removeAccessToken(): void {
    if (!this.storage) return;
    this.storage.removeItem(this.config.accessTokenKey);
  }

  // ==========================================================================
  // Refresh Token Methods
  // ==========================================================================

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    if (!this.storage) return null;
    return this.storage.getItem(this.config.refreshTokenKey);
  }

  /**
   * Set refresh token in storage
   */
  setRefreshToken(token: string): void {
    if (!this.storage) return;
    this.storage.setItem(this.config.refreshTokenKey, token);
  }

  /**
   * Remove refresh token from storage
   */
  removeRefreshToken(): void {
    if (!this.storage) return;
    this.storage.removeItem(this.config.refreshTokenKey);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if access token exists
   */
  hasAccessToken(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Check if refresh token exists
   */
  hasRefreshToken(): boolean {
    return this.getRefreshToken() !== null;
  }

  /**
   * Check if any token exists
   */
  hasTokens(): boolean {
    return this.hasAccessToken() || this.hasRefreshToken();
  }

  /**
   * Clear all tokens from storage
   */
  clear(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
  }

  /**
   * Get storage type
   */
  getStorageType(): StorageType {
    return this.config.storageType;
  }

  /**
   * Switch storage type (e.g., from sessionStorage to localStorage)
   */
  switchStorageType(storageType: StorageType): void {
    if (typeof window === 'undefined') return;

    // Get current tokens before switching
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // Clear old storage
    this.clear();

    // Update storage type
    this.config.storageType = storageType;
    this.storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;

    // Restore tokens in new storage
    if (accessToken) this.setAccessToken(accessToken);
    if (refreshToken) this.setRefreshToken(refreshToken);
  }

  /**
   * Decode JWT token (without verification)
   * Note: This is client-side only and should not be used for security decisions
   */
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    return new Date(decoded.exp * 1000);
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiration(token: string): number | null {
    const expirationDate = this.getTokenExpiration(token);
    if (!expirationDate) return null;

    return expirationDate.getTime() - Date.now();
  }

  /**
   * Check if access token needs refresh (expires in less than 5 minutes)
   */
  shouldRefreshToken(bufferMinutes: number = 5): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    const timeUntilExpiration = this.getTimeUntilExpiration(accessToken);
    if (timeUntilExpiration === null) return false;

    const bufferMs = bufferMinutes * 60 * 1000;
    return timeUntilExpiration < bufferMs;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default token storage instance
 */
export const tokenStorage = new TokenStorage();

/**
 * Export as default for convenience
 */
export default tokenStorage;
