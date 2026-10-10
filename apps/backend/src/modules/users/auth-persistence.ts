import { BadRequestException } from '@nestjs/common';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type { User } from './entities/user.entity';
import { createHash } from 'crypto';

function requireTenant(tenantId: string): void {
  if (!tenantId) throw new BadRequestException('Tenant context required');
}

export async function rotateRefreshCredentials(
  repository: Repository<User>,
  userId: string,
  tenantId: string,
  expectedStoredToken: string,
  expectedVersion: number,
  newToken: string,
  newExpiry: Date,
): Promise<boolean> {
  requireTenant(tenantId);
  const expectedTokenHash = `refresh_hash_${createHash('sha256').update(expectedStoredToken).digest('hex')}`;
  const newTokenHash = `refresh_hash_${createHash('sha256').update(newToken).digest('hex')}`;
  const result = await repository.update(
    {
      id: userId,
      tenantId,
      deletedAt: IsNull(),
      refreshToken: expectedTokenHash,
      tokenVersion: expectedVersion,
      isActive: true,
      refreshTokenExpires: MoreThan(new Date()),
    },
    { refreshToken: newTokenHash, refreshTokenExpires: newExpiry },
  );
  return result.affected === 1;
}

export async function replacePasswordCredentials(
  repository: Repository<User>,
  userId: string,
  tenantId: string,
  hashedPassword: string,
  expectedVersion: number,
): Promise<boolean> {
  requireTenant(tenantId);
  const result = await repository.update(
    {
      id: userId,
      tenantId,
      deletedAt: IsNull(),
      tokenVersion: expectedVersion,
      isActive: true,
    },
    {
      password: hashedPassword,
      tokenVersion: () => '"tokenVersion" + 1',
      refreshToken: null,
      refreshTokenExpires: null,
    },
  );
  return result.affected === 1;
}

export async function consumeVerificationCredentials(
  repository: Repository<User>,
  userId: string,
  tenantId: string,
  expectedToken: string,
): Promise<boolean> {
  requireTenant(tenantId);
  if (!expectedToken.startsWith('verify_')) return false;
  const expectedTokenHash = `verify_hash_${createHash('sha256').update(expectedToken).digest('hex')}`;
  const now = new Date();
  const result = await repository.update(
    {
      id: userId,
      tenantId,
      deletedAt: IsNull(),
      isActive: true,
      emailVerified: false,
      emailVerificationToken: expectedTokenHash,
      emailVerificationExpires: MoreThan(now),
    },
    {
      emailVerified: true,
      emailVerifiedAt: now,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  );
  return result.affected === 1;
}

export async function consumePasswordResetCredentials(
  repository: Repository<User>,
  userId: string,
  tenantId: string,
  expectedToken: string,
  hashedPassword: string,
): Promise<boolean> {
  requireTenant(tenantId);
  if (!/^reset_[a-f0-9]{64}$/.test(expectedToken)) return false;
  const expectedTokenHash = `reset_hash_${createHash('sha256').update(expectedToken).digest('hex')}`;
  const now = new Date();
  const result = await repository.update(
    {
      id: userId,
      tenantId,
      deletedAt: IsNull(),
      isActive: true,
      emailVerificationToken: expectedTokenHash,
      emailVerificationExpires: MoreThan(now),
    },
    {
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: now,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      tokenVersion: () => '"tokenVersion" + 1',
      refreshToken: null,
      refreshTokenExpires: null,
    },
  );
  return result.affected === 1;
}

export async function revokeSessionCredentials(
  repository: Repository<User>,
  userId: string,
  tenantId: string,
  expectedVersion: number,
): Promise<boolean> {
  requireTenant(tenantId);
  const result = await repository.update(
    {
      id: userId,
      tenantId,
      deletedAt: IsNull(),
      isActive: true,
      tokenVersion: expectedVersion,
    },
    {
      tokenVersion: () => '"tokenVersion" + 1',
      refreshToken: null,
      refreshTokenExpires: null,
    },
  );
  return result.affected === 1;
}

export async function consumeInvitationCredentials(
  repository: Repository<User>,
  userId: string,
  tenantId: string,
  invitationToken: string,
  hashedPassword: string,
): Promise<boolean> {
  requireTenant(tenantId);
  if (!/^invite_[a-f0-9]{64}$/.test(invitationToken)) return false;
  const tokenHash = `invite_hash_${createHash('sha256').update(invitationToken).digest('hex')}`;
  const now = new Date();
  const result = await repository.update(
    {
      id: userId,
      tenantId,
      deletedAt: IsNull(),
      isActive: true,
      emailVerified: false,
      emailVerificationToken: tokenHash,
      emailVerificationExpires: MoreThan(now),
    },
    {
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: now,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      tokenVersion: () => '"tokenVersion" + 1',
      refreshToken: null,
      refreshTokenExpires: null,
    },
  );
  return result.affected === 1;
}
