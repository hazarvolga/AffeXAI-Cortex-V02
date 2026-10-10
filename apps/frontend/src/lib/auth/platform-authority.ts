/** Call with a principal returned by login/me, never locally decoded token claims. */
export function hasPlatformAuthority(user: unknown): boolean {
  return typeof user === 'object' && user !== null &&
    'isPlatformAdmin' in user && user.isPlatformAdmin === true;
}
