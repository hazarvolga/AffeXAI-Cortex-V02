import { SubscriberStatus } from "@affexai/shared-types";
import { Queue } from "bullmq";
import { Repository } from "typeorm";
import { TenantService } from "../../../../core/tenant/tenant.service";
import { ExportJob, ExportJobStatus } from "../../entities/export-job.entity";
import { Group } from "../../entities/group.entity";
import { Segment } from "../../entities/segment.entity";
import { Subscriber } from "../../entities/subscriber.entity";
import { BulkExportService, spreadsheetSafeRow } from "../bulk-export.service";
import { BulkOperationsComplianceService } from "../bulk-operations-compliance.service";

function setup() {
  const jobs = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "job-1", ...value })),
  };
  const queue = { add: jest.fn(async () => ({ id: "q-1" })) };
  const service = new BulkExportService(
    jobs as unknown as Repository<ExportJob>,
    {} as Repository<Subscriber>,
    { findBy: jest.fn(async () => []) } as unknown as Repository<Group>,
    { findBy: jest.fn(async () => []) } as unknown as Repository<Segment>,
    {} as BulkOperationsComplianceService,
    queue as unknown as Queue,
    { getTenantId: () => "tenant-a" } as unknown as TenantService,
  );
  return { service, jobs, queue };
}

const subscriber = (overrides: Partial<Subscriber> = {}) =>
  ({
    email: "ada@example.com",
    firstName: "Ada",
    lastName: null,
    status: SubscriberStatus.ACTIVE,
    groups: ["g1", "g2"],
    segments: null,
    opens: 3,
    subscribedAt: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  }) as unknown as Subscriber;

describe("BulkExportService formatting and jobs", () => {
  it("offers the documented export fields", () => {
    expect(setup().service.getAvailableFields()).toEqual(
      expect.arrayContaining([
        "email",
        "firstName",
        "status",
        "groups",
        "segments",
        "subscribedAt",
      ]),
    );
  });

  it("formats only the selected fields, with empty values and joined lists", async () => {
    const [row] = await setup().service.formatSubscriberData([subscriber()], {
      format: "csv",
      fields: [
        "email",
        "lastName",
        "groups",
        "segments",
        "opens",
        "subscribedAt",
      ],
    } as never);
    expect(row).toEqual({
      email: "ada@example.com",
      lastName: "",
      groups: "g1;g2",
      segments: "",
      opens: 3,
      subscribedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("neutralises spreadsheet formulas in exported text", async () => {
    const [row] = await setup().service.formatSubscriberData(
      [
        subscriber({
          firstName: '=HYPERLINK("http://evil.test")',
          company: "+1 calc",
          phone: "-5",
        } as never),
      ],
      {
        format: "csv",
        fields: ["firstName", "company", "phone", "opens"],
      } as never,
    );
    expect(row).toEqual({
      firstName: `'=HYPERLINK("http://evil.test")`,
      company: "'+1 calc",
      phone: "'-5",
      opens: 3,
    });
    expect(spreadsheetSafeRow({ note: "@SUM(A1)", plain: "hello" })).toEqual({
      note: "'@SUM(A1)",
      plain: "hello",
    });
  });

  it("creates a pending job for the requesting tenant and queues it with retries", async () => {
    const { service, jobs, queue } = setup();
    const job = await service.createExportJob(
      { status: [SubscriberStatus.ACTIVE], tenantId: "tenant-b" } as never,
      { format: "csv", fields: ["email"] } as never,
      "tenant-a",
      "user-1",
    );
    expect(job).toMatchObject({
      id: "job-1",
      status: ExportJobStatus.PENDING,
      tenantId: "tenant-a",
      userId: "user-1",
    });
    expect(jobs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ tenantId: "tenant-a" }),
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      "process-export",
      expect.objectContaining({
        jobId: "job-1",
        filters: expect.objectContaining({ tenantId: "tenant-a" }),
      }),
      expect.objectContaining({ attempts: 3 }),
    );
  });
});
