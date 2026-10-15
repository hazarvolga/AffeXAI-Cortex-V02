import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Repository } from "typeorm";
import { PlatformAdminGuard } from "../../core/auth/guards/platform-admin.guard";
import { CommerceService } from "../commerce/services/commerce.service";
import { StrategyService } from "../strategy/services/strategy.service";
import { UsersService } from "../users/users.service";
import { CertificatesController } from "./certificates.controller";
import { CertificatesService } from "./certificates.service";
import { Certificate } from "./entities/certificate.entity";

// The collaborators pull in most of the application; none of their code runs here.
jest.mock("../users/users.service", () => ({ UsersService: class {} }));
jest.mock("../strategy/services/strategy.service", () => ({
  StrategyService: class {},
}));
jest.mock("../commerce/services/commerce.service", () => ({
  CommerceService: class {},
}));
jest.mock("./certificates-v2.service", () => ({
  CertificatesServiceV2: class {},
}));

function setup(allowed = true) {
  const repo = { save: jest.fn(async (value) => ({ id: "c1", ...value })) };
  const users = {
    findOne: jest.fn(async () => ({ id: "u1", tenantId: "tenant-a" })),
  };
  const commerce = { checkLimit: jest.fn(async () => ({ allowed })) };
  const strategy = { emitSignal: jest.fn(async () => undefined) };
  const service = new CertificatesService(
    repo as unknown as Repository<Certificate>,
    users as unknown as UsersService,
    strategy as unknown as StrategyService,
    commerce as unknown as CommerceService,
  );
  return { service, repo, commerce, strategy };
}

const pdfDoc = () => {
  const doc: Record<string, jest.Mock> = {};
  for (const method of [
    "fontSize",
    "fillColor",
    "text",
    "moveDown",
    "font",
    "image",
    "rect",
    "stroke",
    "lineWidth",
    "strokeColor",
    "moveTo",
    "lineTo",
    "fill",
    "fillAndStroke",
    "circle",
    "save",
    "restore",
    "opacity",
    "roundedRect",
    "dash",
    "undash",
  ]) {
    doc[method] = jest.fn(() => doc);
  }
  return doc;
};

describe("CertificatesService (legacy)", () => {
  it("checks the plan limit of the recipient tenant before saving", async () => {
    const { service, repo, commerce, strategy } = setup();
    await service.create(
      undefined as never,
      { name: "Cert 1", userId: "u1" } as never,
    );
    expect(commerce.checkLimit).toHaveBeenCalledWith("tenant-a");
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cert 1", userId: "u1" }),
    );
    expect(strategy.emitSignal).toHaveBeenCalledWith(
      "tenant-a",
      "CERTIFICATE_GENERATED",
      expect.objectContaining({ certificateId: "c1" }),
    );
  });

  it("saves nothing over the plan limit", async () => {
    const { service, repo } = setup(false);
    await expect(
      service.create(
        undefined as never,
        { name: "Cert", userId: "u1" } as never,
      ),
    ).rejects.toThrow("Plan Limit Exceeded");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it.each(["applyDefaultDesign", "applyPremiumDesign", "applyExecutiveDesign"])(
    "%s carries no third-party branding",
    (design) => {
      const { service } = setup();
      const doc = pdfDoc();
      (
        service as unknown as Record<
          string,
          (doc: unknown, cert: unknown) => void
        >
      )[design](doc, {
        recipientName: "Ada",
        name: "Course",
        trainingTitle: "Course",
        issueDate: new Date("2026-10-15"),
        issuedAt: new Date("2026-10-15"),
      });
      const printed = doc.text.mock.calls
        .map(([value]) => String(value))
        .join(" ");
      expect(printed).not.toMatch(/allplan/i);
      expect(printed).toContain("Ada");
    },
  );

  it("exposes the unscoped legacy routes to platform admins only", () => {
    for (const route of [
      "create",
      "findAll",
      "findOne",
      "generatePdf",
      "update",
      "remove",
      "bulkImport",
    ] as const) {
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          CertificatesController.prototype[route],
        ),
      ).toEqual([PlatformAdminGuard]);
    }
  });
});
