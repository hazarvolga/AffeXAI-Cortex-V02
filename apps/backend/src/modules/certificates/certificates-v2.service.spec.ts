import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Repository } from "typeorm";
import { PlatformAdminGuard } from "../../core/auth/guards/platform-admin.guard";
import { MediaService } from "../media/media.service";
import { EventBusService } from "../platform-integration/services/event-bus.service";
import { UsersService } from "../users/users.service";
import { CertificateEmailService } from "./certificate-email.service";
import { CertificatesController } from "./certificates.controller";
import { CertificatesServiceV2 } from "./certificates-v2.service";
import { Certificate, CertificateStatus } from "./entities/certificate.entity";
import { CertificateTemplate } from "./entities/certificate-template.entity";
import { PdfGeneratorService } from "./pdf-generator.service";
import { SettingsService } from "../settings/settings.service";

// Collaborators pull in puppeteer, mail, media and the event bus; none of their code runs here.
jest.mock("./pdf-generator.service", () => ({ PdfGeneratorService: class {} }));
jest.mock("./certificate-email.service", () => ({
  CertificateEmailService: class {},
}));
jest.mock("../users/users.service", () => ({ UsersService: class {} }));
jest.mock("../media/media.service", () => ({ MediaService: class {} }));
jest.mock("../platform-integration/services/event-bus.service", () => ({
  EventBusService: class {},
}));
jest.mock("./certificates.service", () => ({ CertificatesService: class {} }));
jest.mock("../settings/settings.service", () => ({
  SettingsService: class {},
}));

const TENANT = "tenant-a";

function queryBuilder() {
  const qb: Record<string, jest.Mock> = {};
  for (const method of ["leftJoinAndSelect", "where", "andWhere"])
    qb[method] = jest.fn(() => qb);
  qb.getMany = jest.fn(async () => []);
  qb.getCount = jest.fn(async () => 3);
  qb.clone = jest.fn(() => qb);
  return qb;
}

function setup(stored: Partial<Certificate> | null = null) {
  const qb = queryBuilder();
  const certificates = {
    save: jest.fn(async (value) => ({ id: "c1", ...value })),
    findOne: jest.fn(async () => stored),
    remove: jest.fn(async () => undefined),
    createQueryBuilder: jest.fn(() => qb),
  };
  const template = { id: "t1", name: "Default" } as CertificateTemplate;
  const templates = { findOne: jest.fn(async () => template) };
  const pdf = {
    generateCertificatePdf: jest.fn(async () => "/pdf/c1.pdf"),
    pdfExists: jest.fn(async () => false),
    deletePdf: jest.fn(),
  };
  const email = { sendCertificateEmail: jest.fn(async () => undefined) };
  const users = {
    findOne: jest.fn(async (id: string) => ({
      id,
      tenantId: id === "foreign-user" ? "tenant-b" : TENANT,
    })),
  };
  const bus = { publishCertificateIssued: jest.fn(async () => undefined) };
  const settings = {
    getSiteSettings: jest.fn(async () => ({
      companyName: "XYZ Company",
      logoUrl: "https://cdn.example.test/logo.png",
      contact: { address: "Istanbul" },
    })),
  };
  const service = new CertificatesServiceV2(
    certificates as unknown as Repository<Certificate>,
    templates as unknown as Repository<CertificateTemplate>,
    pdf as unknown as PdfGeneratorService,
    email as unknown as CertificateEmailService,
    users as unknown as UsersService,
    {} as MediaService,
    bus as unknown as EventBusService,
    settings as unknown as SettingsService,
  );
  return { service, certificates, qb, pdf, email, bus, settings };
}

const draft = (overrides: Partial<Certificate> = {}) =>
  Object.assign(new Certificate(), {
    id: "c1",
    tenantId: TENANT,
    recipientName: "Ada",
    recipientEmail: "ada@example.com",
    trainingTitle: "Course",
    issuedAt: new Date("2026-10-15"),
    status: CertificateStatus.DRAFT,
    ...overrides,
  });

describe("CertificatesServiceV2", () => {
  it("creates a draft in the tenant and announces only issued certificates", async () => {
    const { service, certificates, bus } = setup();
    await service.createCertificate(
      {
        recipientName: "Ada",
        recipientEmail: "ada@example.com",
        trainingTitle: "Course",
      } as never,
      TENANT,
    );
    expect(certificates.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT,
        status: CertificateStatus.DRAFT,
        name: "Course",
      }),
    );
    expect(bus.publishCertificateIssued).not.toHaveBeenCalled();
    await service.createCertificate(
      {
        recipientName: "Ada",
        trainingTitle: "Course",
        status: CertificateStatus.ISSUED,
      } as never,
      TENANT,
    );
    expect(bus.publishCertificateIssued).toHaveBeenCalledWith(
      "c1",
      "unknown",
      undefined,
    );
  });

  it("refuses to link a user of another tenant", async () => {
    const { service, certificates } = setup(draft());
    await expect(
      service.createCertificate(
        { recipientName: "Ada", userId: "foreign-user" } as never,
        TENANT,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateCertificate("c1", TENANT, {
        userId: "foreign-user",
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(certificates.save).not.toHaveBeenCalled();
  });

  it("keeps the tenant condition when listing one user", async () => {
    const { service, qb } = setup();
    await service.findAllCertificates(TENANT, "u1");
    expect(qb.where).toHaveBeenCalledTimes(1);
    expect(qb.where).toHaveBeenCalledWith("certificate.tenantId = :tenantId", {
      tenantId: TENANT,
    });
    expect(qb.andWhere).toHaveBeenCalledWith("certificate.userId = :userId", {
      userId: "u1",
    });
  });

  it("counts statistics inside the tenant", async () => {
    const { service, qb } = setup();
    await expect(service.getStatistics(TENANT)).resolves.toMatchObject({
      total: 3,
    });
    expect(qb.where).toHaveBeenCalledWith("certificate.tenantId = :tenantId", {
      tenantId: TENANT,
    });
  });

  it("generates the PDF with the tenant, then marks the certificate issued", async () => {
    const certificate = draft();
    const { service, pdf, settings } = setup(certificate);
    await expect(service.generatePdf("c1", TENANT)).resolves.toBe(
      "/pdf/c1.pdf",
    );
    expect(settings.getSiteSettings).toHaveBeenCalledWith(TENANT);
    expect(pdf.generateCertificatePdf).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
      expect.objectContaining({
        recipientName: "Ada",
        companyName: "XYZ Company",
        companyAddress: "Istanbul",
        companyLogoUrl: "https://cdn.example.test/logo.png",
      }),
      "c1",
      TENANT,
    );
    expect(certificate).toMatchObject({
      pdfUrl: "/pdf/c1.pdf",
      status: CertificateStatus.ISSUED,
    });
  });

  it("refuses to email before a PDF exists, then sends and marks it sent", async () => {
    const { service, email } = setup(draft());
    await expect(service.sendEmail("c1", TENANT)).rejects.toThrow(
      BadRequestException,
    );
    const withPdf = draft({ pdfUrl: "/pdf/c1.pdf" });
    const ready = setup(withPdf);
    await ready.service.sendEmail("c1", TENANT);
    expect(ready.email.sendCertificateEmail).toHaveBeenCalledWith(withPdf);
    expect(withPdf.status).toBe(CertificateStatus.SENT);
    expect(email.sendCertificateEmail).not.toHaveBeenCalled();
  });

  it("reports a certificate of another tenant as missing", async () => {
    const { service, certificates } = setup(null);
    await expect(service.findOneCertificate("c1", TENANT)).rejects.toThrow(
      NotFoundException,
    );
    expect(certificates.findOne).toHaveBeenCalledWith({
      where: { id: "c1", tenantId: TENANT },
      relations: ["user"],
    });
  });

  it("lets only platform admins change the shared templates", () => {
    for (const route of [
      "createTemplate",
      "replaceTemplate",
      "updateTemplate",
      "removeTemplate",
    ] as const) {
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          CertificatesController.prototype[route],
        ),
      ).toEqual([PlatformAdminGuard]);
    }
    expect(
      Reflect.getMetadata(
        "permissions",
        CertificatesController.prototype.findAllV2,
      ),
    ).toEqual(["certificates.view"]);
    expect(
      Reflect.getMetadata(
        "permissions",
        CertificatesController.prototype.removeV2,
      ),
    ).toEqual(["certificates.revoke"]);
  });
});
