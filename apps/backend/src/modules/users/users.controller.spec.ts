// @nestjs/mapped-types@12 is ESM-only and cannot load in Jest's CommonJS runtime;
// these specs only read route metadata, so the DTO helpers can be plain pass-throughs.
jest.mock("@nestjs/mapped-types", () => ({
  PartialType: (Base: new (...args: any[]) => any) => class extends Base {},
  PickType: (Base: new (...args: any[]) => any) => class extends Base {},
  OmitType: (Base: new (...args: any[]) => any) => class extends Base {},
}));

// Only route metadata is read; stub the services so Jest does not compile the
// whole backend graph behind them.
jest.mock("./users.service", () => ({ UsersService: class {} }));
jest.mock("./user-roles.service", () => ({ UserRolesService: class {} }));
jest.mock("../tickets/tickets.service", () => ({ TicketsService: class {} }));
jest.mock("../../core/auth/guards/jwt-auth.guard", () => ({
  JwtAuthGuard: class {},
}));
jest.mock("../../core/auth/guards/roles.guard", () => ({
  RolesGuard: class {},
}));

import { UsersController } from "./users.controller";
import { UserRole } from "./enums/user-role.enum";

describe("UsersController", () => {
  it.each(["findAll", "findOne", "getUserRoles"] as const)(
    "keeps personal user data endpoint %s administrator-only",
    (method) => {
      const roles = Reflect.getMetadata(
        "roles",
        UsersController.prototype[method],
      );
      expect(roles).toEqual([UserRole.ADMIN]);
    },
  );

  it("keeps self-service profile access available through /users/me", () => {
    const roles = Reflect.getMetadata(
      "roles",
      UsersController.prototype.getCurrentUser,
    );
    expect(roles).toBeUndefined();
  });
});
