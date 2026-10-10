import { instanceToPlain } from 'class-transformer';
import { User } from './entities/user.entity';

describe('public user serialization', () => {
  it('does not expose credentials through users or nested relation responses', () => {
    const user = Object.assign(new User(), {
      id: 'user-a', email: 'person@example.com', firstName: 'Person',
      password: 'password-hash', refreshToken: 'refresh-bearer',
      refreshTokenExpires: new Date(), emailVerificationToken: 'verification-bearer',
      emailVerificationExpires: new Date(),
    });
    const payload = instanceToPlain({ user, users: [user] });
    for (const result of [payload.user, payload.users[0]]) {
      expect(result).toMatchObject({ id: 'user-a', email: 'person@example.com' });
      for (const field of ['password', 'refreshToken', 'refreshTokenExpires', 'emailVerificationToken', 'emailVerificationExpires']) {
        expect(result).not.toHaveProperty(field);
      }
    }
  });

  it('does not grant inactive assigned roles through computed authorization fields', () => {
    const user = Object.assign(new User(), {
      userRoles: [
        { isPrimary: true, role: { name: 'organization_owner', isActive: false } },
        { isPrimary: false, role: { name: 'viewer', isActive: true } },
      ],
    });
    expect(user.primaryRole).toBeNull();
    expect(user.roleNames).toEqual(['viewer']);
  });
});
