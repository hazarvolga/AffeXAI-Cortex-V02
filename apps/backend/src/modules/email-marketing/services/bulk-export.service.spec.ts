import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Queue } from "bullmq";
import { In, Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { ExportJob } from "../entities/export-job.entity";
import { Group } from "../entities/group.entity";
import { Segment } from "../entities/segment.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { BulkExportService } from "./bulk-export.service";
import { BulkOperationsComplianceService } from "./bulk-operations-compliance.service";

function setup(
  options: { groups?: Partial<Group>[]; tenant?: string | null } = {},
) {
  const qb = { andWhere: jest.fn(() => qb) };
  const groups = { findBy: jest.fn(async () => options.groups ?? []) };
  const jobs = {
    findOne: jest.fn(async () => null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const queue = { add: jest.fn() };
  const service = new BulkExportService(
    jobs as unknown as Repository<ExportJob>,
    {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<Subscriber>,
    groups as unknown as Repository<Group>,
    { findBy: jest.fn(async () => []) } as unknown as Repository<Segment>,
    {} as BulkOperationsComplianceService,
    queue as unknown as Queue,
    {
      getTenantId: () =>
        options.tenant === undefined ? "tenant-a" : options.tenant,
    } as unknown as TenantService,
  );
  return { service, qb, groups, jobs, queue };
}

const create = (service: BulkExportService, filters: object, options: object) =>
  service.createExportJob(
    filters as never,
    { format: "csv", fields: ["email"], ...options } as never,
    "tenant-a",
  );

describe("BulkExportService query and validation", () => {
  it("filters by tenant and uses Postgres json overlap for groups and segments", async () => {
    const { service, qb } = setup();
    await service.buildSubscriberQuery({
      tenantId: "tenant-a",
      groupIds: ["g1", "g2"],
      segmentIds: ["s1"],
    } as never);
    expect(qb.andWhere).toHaveBeenCalledWith(
      "subscriber.tenantId = :tenantId",
      { tenantId: "tenant-a" },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      "subscriber.groups::jsonb ?| ARRAY[:...groupIds]::text[]",
      { groupIds: ["g1", "g2"] },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      "subscriber.segments::jsonb ?| ARRAY[:...segmentIds]::text[]",
      { segmentIds: ["s1"] },
    );
    expect(JSON.stringify(qb.andWhere.mock.calls)).not.toContain(
      "JSON_OVERLAPS",
    );
  });

  it.each([
    ["an unknown format", {}, { format: "pdf" }],
    ["no fields", {}, { fields: [] }],
    ["an unknown field", {}, { fields: ["password"] }],
    ["a batch size out of range", {}, { batchSize: 50 }],
    [
      "a reversed date range",
      {
        dateRange: {
          start: new Date("2026-10-02"),
          end: new Date("2026-10-01"),
        },
      },
      {},
    ],
  ])("rejects %s", async (_label, filters, options) => {
    const { service, queue } = setup();
    await expect(create(service, filters, options)).rejects.toThrow(
      BadRequestException,
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("accepts only groups of the requesting tenant", async () => {
    const { service, groups } = setup({ groups: [{ id: "g1" }] });
    await expect(
      create(service, { groupIds: ["g1", "foreign"] }, {}),
    ).rejects.toThrow("One or more group IDs do not exist");
    expect(groups.findBy).toHaveBeenCalledWith({
      id: In(["g1", "foreign"]),
      tenantId: "tenant-a",
    });
  });

  it("reads job status inside the tenant only", async () => {
    const { service, jobs } = setup();
    await expect(service.getExportStatus("job-x")).rejects.toThrow(
      NotFoundException,
    );
    expect(jobs.findOne).toHaveBeenCalledWith({
      where: { id: "job-x", tenantId: "tenant-a" },
    });
    await expect(
      setup({ tenant: null }).service.getExportStatus("job-x"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
