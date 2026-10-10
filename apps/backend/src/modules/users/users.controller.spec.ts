jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (Base: new (...args: any[]) => any) => class extends Base {},
}));

import { UsersController } from './users.controller';
import { UserRole } from './enums/user-role.enum';

describe('UsersController', () => {
  it.each(['findAll', 'findOne', 'getUserRoles'] as const)(
    'keeps personal user data endpoint %s administrator-only',
    method => {
      const roles = Reflect.getMetadata('roles', UsersController.prototype[method]);
      expect(roles).toEqual([UserRole.ADMIN]);
    },
  );

  it('keeps self-service profile access available through /users/me', () => {
    const roles = Reflect.getMetadata('roles', UsersController.prototype.getCurrentUser);
    expect(roles).toBeUndefined();
  });
});
