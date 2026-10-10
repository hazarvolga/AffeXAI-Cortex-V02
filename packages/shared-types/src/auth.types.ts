/**
 * Authentication and authorization types
 */

import { UserRole, UserProfile } from './user.types';

/**
 * Login credentials
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
  expires_in: number; // seconds
}

/**
 * Token payload (JWT claims)
 */
export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number; // issued at
  exp: number; // expiration
}

/**
 * Refresh token request
 */
export interface RefreshTokenDto {
  refresh_token: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/**
 * Password reset request
 */
export interface PasswordResetRequestDto {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetDto {
  token: string;
  newPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Auth session data
 */
export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: Date;
}
