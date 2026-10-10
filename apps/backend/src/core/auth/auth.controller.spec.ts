import { HttpException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "../../modules/users/users.service";

describe("AuthController", () => {
  const authService = {
    verifyEmail: jest.fn(),
  };
  const usersService = {};
  const controller = new AuthController(
    authService as unknown as AuthService,
    usersService as unknown as UsersService,
  );

  beforeEach(() => jest.resetAllMocks());

  it("verifies email only after an explicit controller call and does not issue a session", async () => {
    authService.verifyEmail.mockResolvedValue({ id: "user-1" });

    await expect(
      controller.verifyEmail({ token: `verify_${"a".repeat(64)}` }),
    ).resolves.toEqual({
      success: true,
      message: "Email adresiniz başarıyla doğrulandı. Şimdi giriş yapabilirsiniz.",
    });
    expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid or expired verification token", async () => {
    authService.verifyEmail.mockResolvedValue(null);

    await expect(
      controller.verifyEmail({ token: `verify_${"b".repeat(64)}` }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
