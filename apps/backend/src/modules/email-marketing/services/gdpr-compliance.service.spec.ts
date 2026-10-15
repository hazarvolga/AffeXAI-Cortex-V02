import { UnauthorizedException } from "@nestjs/common";
import { SubscriberStatus } from "@affexai/shared-types";
import { Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { Subscriber } from "../entities/subscriber.entity";
import {
  ConsentMethod,
  ConsentStatus,
  ConsentType,
  GdprComplianceService,
  LegalBasis,
  RequestStatus,
} from "./gdpr-compliance.service";

const TENANT = "tenant-a";
const EMAIL = "ada@example.com";

function setup(activeTenant: string | null = TENANT) {
  const subscriber = {
    id: "sub-1",
    email: EMAIL,
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "5551234",
    tenantId: TENANT,
    status: SubscriberStatus.ACTIVE,
    sent: 3,
    opens: 2,
    clicks: 1,
  } as unknown as Subscriber;
  const repository = {
    findOne: jest.fn(async () => subscriber),
    update: jest.fn(async () => ({ affected: 1 })),
    delete: jest.fn(async () => ({ affected: 1 })),
    count: jest.fn(async () => 0),
  };
  const tenants = { getTenantId: jest.fn(() => activeTenant) };
  const service = new GdprComplianceService(
    repository as unknown as Repository<Subscriber>,
    tenants as unknown as TenantService,
  );
  return { service, repository, subscriber };
}

describe("GdprComplianceService", () => {
  it("records consent against the subscriber of the active tenant", async () => {
    const { service, repository } = setup();
    const record = await service.trackConsent(
      EMAIL,
      ConsentType.EMAIL_MARKETING,
      ConsentMethod.DOUBLE_OPT_IN,
      LegalBasis.CONSENT,
      {
        dataProcessingPurposes: ["newsletter"],
      },
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: EMAIL, tenantId: TENANT },
    });
    expect(record).toMatchObject({
      subscriberId: "sub-1",
      tenantId: TENANT,
      consentStatus: ConsentStatus.GIVEN,
    });
  });

  it("unsubscribes with the stored enum value when marketing consent is withdrawn", async () => {
    const { service, repository } = setup();
    await service.withdrawConsent(EMAIL, ConsentType.EMAIL_MARKETING, "asked");
    expect(repository.update).toHaveBeenCalledWith(
      { email: EMAIL, tenantId: TENANT },
      { status: SubscriberStatus.UNSUBSCRIBED },
    );
  });

  it("leaves the subscription alone when another consent is withdrawn", async () => {
    const { service, repository } = setup();
    await service.withdrawConsent(EMAIL, ConsentType.ANALYTICS);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("anonymises instead of deleting when statistics are kept", async () => {
    const { service, repository } = setup();
    const request = await service.handleErasureRequest(EMAIL, true);
    expect(request.status).toBe(RequestStatus.COMPLETED);
    expect(repository.delete).not.toHaveBeenCalled();
    const [where, updates] = repository.update.mock.calls[0] as unknown as [
      object,
      Record<string, string>,
    ];
    expect(where).toEqual({ email: EMAIL, tenantId: TENANT });
    expect(updates.email).toMatch(/^[0-9a-f]{16}$/);
    expect(updates.firstName).not.toBe("Ada");
  });

  it("deletes only inside the tenant on full erasure", async () => {
    const { service, repository } = setup();
    await service.handleErasureRequest(EMAIL, false);
    expect(repository.delete).toHaveBeenCalledWith({
      email: EMAIL,
      tenantId: TENANT,
    });
  });

  it("exports portable data and rejects an unknown address", async () => {
    const { service, repository } = setup();
    const done = await service.handlePortabilityRequest(EMAIL);
    expect(done.status).toBe(RequestStatus.COMPLETED);
    expect(done.responseData.engagementData).toEqual({
      emailsSent: 3,
      emailsOpened: 2,
      linksClicked: 1,
    });
    repository.findOne.mockResolvedValueOnce(null as unknown as Subscriber);
    await expect(
      service.handlePortabilityRequest("nobody@example.com"),
    ).resolves.toMatchObject({ status: RequestStatus.REJECTED });
  });

  it("counts active subscribers with the stored enum value", async () => {
    const { service, repository } = setup();
    await service.generateComplianceReport();
    expect(repository.count).toHaveBeenCalledWith({
      where: { status: SubscriberStatus.ACTIVE, tenantId: TENANT },
    });
  });

  it("generalises and suppresses export fields", async () => {
    const { service, subscriber } = setup();
    const [generalised] = await service.anonymizeDataForExport([subscriber], {
      preserveStatistics: true,
      anonymizationMethod: "generalize",
      fieldsToAnonymize: ["email", "phone", "firstName"],
      retainAggregateData: true,
    });
    expect(generalised).toMatchObject({
      email: "***@example.com",
      phone: "*******",
      firstName: "A**",
    });
    const [suppressed] = await service.anonymizeDataForExport([subscriber], {
      preserveStatistics: false,
      anonymizationMethod: "suppress",
      fieldsToAnonymize: ["email"],
      retainAggregateData: false,
    });
    expect(suppressed.email).toBe("[REDACTED]");
    expect(suppressed.id).toBeUndefined();
  });

  it("requires a tenant context", async () => {
    await expect(
      setup(null).service.handleAccessRequest(EMAIL),
    ).rejects.toThrow(UnauthorizedException);
  });
});
