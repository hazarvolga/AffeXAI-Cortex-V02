import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Queue } from "bullmq";
import { LessThan, Repository } from "typeorm";
import { TenantService } from "../../../core/tenant/tenant.service";
import { ImportJob, ImportJobStatus } from "../entities/import-job.entity";
import { ImportResult } from "../entities/import-result.entity";
import { BulkImportService } from "./bulk-import.service";
import { BulkOperationsComplianceService } from "./bulk-operations-compliance.service";
import { FileProcessingService } from "./file-processing.service";
import { FileUploadService } from "./file-upload.service";

// The real collaborators pull in S3 and file-type (ESM); none of their code runs here.
jest.mock("./file-processing.service", () => ({
  FileProcessingService: class {},
}));
jest.mock("./file-upload.service", () => ({ FileUploadService: class {} }));

const TENANT = "tenant-a";

function setup(
  options: {
    tenant?: string | null;
    validMapping?: boolean;
    compliant?: boolean;
  } = {},
) {
  const jobs = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: "job-1",
      createdAt: new Date(),
      ...value,
    })),
    findOne: jest.fn(async () => null as ImportJob | null),
    find: jest.fn(
      async () => [{ id: "old-1" }, { id: "old-2" }] as ImportJob[],
    ),
    update: jest.fn(async () => ({ affected: 1 })),
    remove: jest.fn(async () => undefined),
  };
  const existing = {
    select: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getRawMany: jest.fn(async () => [{ email: "ada@example.com" }]),
  };
  existing.select.mockReturnValue(existing);
  existing.where.mockReturnValue(existing);
  existing.andWhere.mockReturnValue(existing);
  const results = {
    manager: {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => existing),
      })),
    },
  };
  const files = {
    parseCsvFile: jest.fn(async () => ({
      totalRows: 2,
      data: [{ email: "a@b.co" }],
      headers: ["email"],
      errors: [],
    })),
    validateColumnMapping: jest.fn(async () => options.validMapping ?? true),
    cleanupTempFiles: jest.fn(async () => undefined),
  };
  const upload = {
    uploadFile: jest.fn(async () => ({
      jobId: "u1",
      fileName: "f.csv",
      originalFileName: "list.csv",
      filePath: "/tmp/f.csv",
      s3Url: "s3://bucket/f.csv",
    })),
  };
  const compliance = {
    validateBulkImportCompliance: jest.fn(async () => ({
      isCompliant: options.compliant ?? true,
      issues: ["no consent column"],
    })),
  };
  const queue = { add: jest.fn(async () => ({ id: "q-1" })) };
  const service = new BulkImportService(
    jobs as unknown as Repository<ImportJob>,
    results as unknown as Repository<ImportResult>,
    files as unknown as FileProcessingService,
    upload as unknown as FileUploadService,
    compliance as unknown as BulkOperationsComplianceService,
    queue as unknown as Queue,
    {
      getTenantId: () =>
        options.tenant === undefined ? TENANT : options.tenant,
    } as unknown as TenantService,
  );
  return { service, jobs, files, queue, existing };
}

const params = (gdpr = false) =>
  ({
    file: { originalname: "list.csv" },
    tenantId: TENANT,
    userId: "user-1",
    options: {
      columnMapping: { Email: "email" },
      ...(gdpr ? { gdprCompliance: { requireConsent: true } } : {}),
    },
  }) as never;

describe("BulkImportService", () => {
  it("stores the job with the persistent file and queues it for the tenant", async () => {
    const { service, jobs, queue } = setup();
    const job = await service.createImportJob(params());
    expect(jobs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: "s3://bucket/f.csv",
        totalRecords: 2,
        status: ImportJobStatus.PENDING,
        tenantId: TENANT,
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      "process-import",
      expect.objectContaining({
        jobId: "job-1",
        tenantId: TENANT,
        filePath: "s3://bucket/f.csv",
      }),
      expect.objectContaining({ attempts: 3 }),
    );
    expect(job.id).toBe("job-1");
  });

  it("rejects an invalid column mapping before creating a job", async () => {
    const { service, jobs, queue } = setup({ validMapping: false });
    await expect(service.createImportJob(params())).rejects.toThrow(
      BadRequestException,
    );
    expect(jobs.save).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("fails the job and queues nothing when GDPR validation fails", async () => {
    const { service, jobs, queue } = setup({ compliant: false });
    await expect(service.createImportJob(params(true))).rejects.toThrow(
      "GDPR compliance validation",
    );
    expect(jobs.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: ImportJobStatus.FAILED }),
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("marks duplicates case-insensitively inside the tenant", async () => {
    const { service, existing } = setup();
    const result = await service.checkDuplicates(
      [" Ada@Example.com", "new@example.com"],
      "skip",
    );
    expect(existing.andWhere).toHaveBeenCalledWith(
      "subscriber.tenantId = :tenantId",
      { tenantId: TENANT },
    );
    expect(result.get(" Ada@Example.com")).toEqual({
      isDuplicate: true,
      duplicateType: "email_only",
    });
    expect(result.get("new@example.com")).toEqual({
      isDuplicate: false,
      duplicateType: "none",
    });
  });

  it("cancels a running job of the tenant and refuses a finished one", async () => {
    const { service, jobs, files } = setup();
    await expect(service.cancelImportJob("job-x")).rejects.toThrow(
      NotFoundException,
    );
    jobs.findOne.mockResolvedValueOnce({
      id: "job-1",
      status: ImportJobStatus.PROCESSING,
    } as ImportJob);
    await service.cancelImportJob("job-1");
    expect(jobs.update).toHaveBeenCalledWith(
      { id: "job-1", tenantId: TENANT },
      expect.objectContaining({ status: ImportJobStatus.FAILED }),
    );
    expect(files.cleanupTempFiles).toHaveBeenCalledWith("job-1");
    jobs.findOne.mockResolvedValueOnce({
      id: "job-2",
      status: ImportJobStatus.COMPLETED,
    } as ImportJob);
    await expect(service.cancelImportJob("job-2")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("cleans up only jobs older than the cutoff", async () => {
    const { service, jobs } = setup();
    await expect(service.cleanupOldJobs(30)).resolves.toBe(2);
    const [[query]] = jobs.find.mock.calls as unknown as [
      [{ where: { createdAt: unknown } }],
    ];
    expect(query.where.createdAt).toEqual(LessThan(expect.any(Date)));
  });

  it("requires a tenant context", async () => {
    await expect(
      setup({ tenant: null }).service.getImportJob("job-1"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
