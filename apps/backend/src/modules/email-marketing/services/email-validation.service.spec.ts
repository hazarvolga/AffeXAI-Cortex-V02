import { EmailValidationService } from "./email-validation.service";

describe("EmailValidationService", () => {
  const service = new EmailValidationService();

  it.each(["test@example.com", "a.b+tag@sub.example.org"])(
    "accepts the format of %s",
    (email) => {
      expect(service.validateEmailFormat(email)).toBe("valid");
    },
  );

  it.each([
    "invalid-email",
    "no-at.example.com",
    "a@b",
    "with space@example.com",
    "",
  ])('rejects the format of "%s"', (email) => {
    expect(service.validateEmailFormat(email)).toBe("invalid");
  });

  it("classifies addresses", async () => {
    await expect(service.validateEmail("test@example.com")).resolves.toBe(
      "valid",
    );
    await expect(service.validateEmail("not-an-email")).resolves.toBe(
      "invalid",
    );
    await expect(service.validateEmail("x@tempmail.com")).resolves.toBe(
      "risky",
    );
    await expect(service.validateEmail("x@throwaway.io")).resolves.toBe(
      "risky",
    );
    await expect(service.validateEmail("x@invalid-domain.com")).resolves.toBe(
      "invalid",
    );
  });
});
