/**
 * Authentication Module
 * 
 * Barrel export for all authentication-related exports.
 */

// Context and hooks
export { AuthProvider, useAuth } from './auth-context';
export type { AuthState, AuthContextValue, AuthProviderProps } from './auth-context';

// Services
export { authService } from '../api/authService';
export { tokenStorage } from './token-storage';
// RegisterDto is now in authService
export type { StorageType, TokenStorageConfig } from './token-storage';

// Protected routes
export { ProtectedRoute, withAuth } from './protected-route';
export type { ProtectedRouteProps } from './protected-route';

// Re-export auth types from shared types
export type {
  LoginDto,
  LoginResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  PasswordResetRequestDto,
  PasswordResetDto,
  ChangePasswordDto,
  AuthSession,
  TokenPayload,
} from '@affexai/shared-types';
