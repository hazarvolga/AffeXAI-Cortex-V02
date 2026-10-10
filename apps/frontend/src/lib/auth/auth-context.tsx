/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Uses React Context API for global state management.
 */

'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type {
  LoginResponse,
} from '@affexai/shared-types';
import { UserRole } from '@affexai/shared-types';
import type { CurrentUser, TenantLoginCredentials } from '../api/authService';
import { authService } from '../api/authService';
import { hasPlatformAuthority } from './platform-authority';
import { tokenStorage } from './token-storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Authentication state
 */
export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
}

/**
 * Authentication context value
 */
export interface AuthContextValue extends AuthState {
  // Authentication methods
  login: (credentials: TenantLoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // User management
  updateUser: (user: Partial<CurrentUser>) => void;

  // Authorization helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;

  // State management
  clearError: () => void;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

export interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Authentication Provider
 * 
 * Wraps the application to provide authentication state and methods.
 * Automatically restores session from stored tokens on mount.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Computed state
  const isAuthenticated = user !== null;

  const isSuperAdmin = hasPlatformAuthority(user);

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: TenantLoginCredentials): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 AuthContext: Starting login process');

      // Call auth service (this will handle token storage internally)
      const response: LoginResponse = await authService.login(credentials);

      console.log('🔐 AuthContext: Login response received:', {
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user
      });

      console.log('🔐 AuthContext: Tokens stored by authService, updating user state');

      // Update user state
      setUser(response.user);

      // Return the response so login page can access user data
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Call auth service (this will handle token clearing)
      await authService.logout();

      // Clear tokens from tokenStorage as well
      tokenStorage.clear();

      // Clear user state
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh access token using refresh token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call auth service
      const response = await authService.refreshToken({ refresh_token: refreshToken });

      // Update access token
      tokenStorage.setAccessToken(response.access_token);
    } catch (err) {
      // Refresh failed, logout user
      console.error('Token refresh failed:', err);
      await logout();
      throw err;
    }
  }, [logout]);

  // ==========================================================================
  // User Management
  // ==========================================================================

  /**
   * Update user profile (optimistic update)
   */
  const updateUser = useCallback((updates: Partial<CurrentUser>): void => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      return { ...currentUser, ...updates };
    });
  }, []);

  // ==========================================================================
  // Authorization Helpers
  // ==========================================================================

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.roleId === role;
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return user ? roles.includes(user.roleId as UserRole) : false;
    },
    [user]
  );

  // ==========================================================================
  // Error Management
  // ==========================================================================

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // ==========================================================================
  // Session Restoration
  // ==========================================================================

  /**
   * Restore session from stored tokens on mount
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if user is authenticated using authService
        const isAuth = authService.isAuthenticated();
        console.log('🔐 Restoring session, user authenticated:', isAuth);

        if (!isAuth) {
          console.log('🔐 No valid token found, user not authenticated');
          setIsLoading(false);
          return;
        }

        console.log('🔐 Validating token and getting current user...');
        // Validate token and get current user
        const currentUser = await authService.getCurrentUser();
        console.log('🔐 Session restored successfully:', currentUser.email);
        setUser(currentUser);
      } catch (err) {
        console.error('🔐 Session restoration failed:', err);
        // Clear invalid tokens
        tokenStorage.clear();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('aluplan_access_token');
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Listen for user sync updates from useUserSync hook
   * This ensures AuthContext stays in sync with backend
   */
  useEffect(() => {
    const handleUserSyncUpdate = (event: CustomEvent) => {
      const freshUser = event.detail.user;
      console.log('🔄 AuthContext: Received user sync update', freshUser.email);
      setUser(freshUser);
    };

    window.addEventListener('user-sync-update', handleUserSyncUpdate as EventListener);

    return () => {
      window.removeEventListener('user-sync-update', handleUserSyncUpdate as EventListener);
    };
  }, []);

  /**
   * Proactive token refresh timer
   * Checks token expiry every minute and refreshes if needed
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(async () => {
      try {
        // Check if token needs refresh (expires in less than 5 minutes)
        const shouldRefresh = tokenStorage.shouldRefreshToken(5);

        if (shouldRefresh) {
          console.log('🔄 Token expiring soon, refreshing proactively...');
          await refreshToken();
          console.log('✅ Proactive token refresh successful');
        }
      } catch (error) {
        console.error('❌ Proactive token refresh failed:', error);
        // The error will be handled by the refreshToken function
        // which will logout the user if refresh fails
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshToken]);

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const contextValue: AuthContextValue = {
    // State
    user,
    isAuthenticated,
    isSuperAdmin,
    isLoading,
    error,

    // Authentication
    login,
    logout,
    refreshToken,

    // User management
    updateUser,

    // Authorization
    hasRole,
    hasAnyRole,

    // Error management
    clearError,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Use authentication context
 * 
 * @throws Error if used outside AuthProvider
 * @returns Authentication context value
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================================================
// Exports
// ============================================================================

export default AuthContext;
