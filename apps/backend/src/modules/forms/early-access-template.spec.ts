import { readFileSync } from "fs";
import { join } from "path";
import { BadRequestException } from "@nestjs/common";
import {
  assertCanonicalFormStructure,
  assertSafePublicFormSettings,
  validateSubmissionData,
} from "./form-schema";

const template = JSON.parse(
  readFileSync(join(__dirname, "templates", "early-access.json"), "utf8"),
);

describe("early access form template", () => {
  it("is a canonical public form with CRM lead capture on the frontend field ids", () => {
    expect(() =>
      assertCanonicalFormStructure(template.structure),
    ).not.toThrow();
    expect(() => assertSafePublicFormSettings(template.settings)).not.toThrow();
    expect(template.settings.crmLeadCapture).toEqual({
      enabled: true,
      emailField: "email",
      companyField: "companyName",
      contactNameField: "contactName",
    });
  });

  it("accepts the payload the marketing form sends, with or without a message", () => {
    const base = {
      contactName: "Ada Yılmaz",
      email: "ada@example.com",
      companyName: "XYZ Company",
    };
    expect(() =>
      validateSubmissionData(template.structure, base),
    ).not.toThrow();
    expect(() =>
      validateSubmissionData(template.structure, {
        ...base,
        message: "CRM ve destek",
      }),
    ).not.toThrow();
  });

  it("rejects the honeypot field so it can never reach a stored submission", () => {
    expect(() =>
      validateSubmissionData(template.structure, {
        contactName: "Bot",
        email: "bot@example.com",
        companyName: "Bot",
        website: "http://spam",
      }),
    ).toThrow(BadRequestException);
  });
});
