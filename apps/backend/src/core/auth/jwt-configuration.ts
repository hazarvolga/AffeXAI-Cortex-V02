import type { JwtModuleOptions } from '@nestjs/jwt';
import { platformAdminIds } from './platform-admin.policy';

export function jwtConfiguration(secret: string | undefined, platformIds?: string): JwtModuleOptions & { secret: string } {
  if (!secret || secret.trim().length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  platformAdminIds(platformIds);
  return { secret, signOptions: { expiresIn: '60m' } };
}
