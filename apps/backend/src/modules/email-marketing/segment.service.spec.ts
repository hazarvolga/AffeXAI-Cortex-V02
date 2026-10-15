import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../core/tenant/tenant.service";
import { Segment } from "./entities/segment.entity";
import { SegmentService } from "./segment.service";

const TENANT = "tenant-a";

function setup(activeTenant: string | null = TENANT) {
  const segment = {
    id: "s1",
    name: "Active",
    description: "d",
    tenantId: TENANT,
    subscriberCount: 4,
    openRate: "12.5",
    clickRate: "3.25",
  } as unknown as Segment;
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => [segment]),
    findOne: jest.fn(async () => segment),
    remove: jest.fn(async (value) => value),
  };
  const tenants = { getTenantId: jest.fn(() => activeTenant) };
  const service = new SegmentService(
    repository as unknown as Repository<Segment>,
    tenants as unknown as TenantService,
  );
  return { service, repository, segment };
}

describe("SegmentService", () => {
  it("creates the segment in the active tenant", async () => {
    const { service, repository } = setup();
    await service.create({ name: "Active", criteria: "opens > 1" } as never);
    expect(repository.create).toHaveBeenCalledWith({
      name: "Active",
      criteria: "opens > 1",
      tenantId: TENANT,
    });
  });

  it("rejects fields a caller may not write", async () => {
    const { service, repository } = setup();
    await expect(
      service.create({ name: "x", subscriberCount: 99 } as never),
    ).rejects.toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("lists only the active tenant and converts decimal rates for import", async () => {
    const { service, repository } = setup();
    await expect(service.findAllForImport()).resolves.toEqual([
      {
        id: "s1",
        name: "Active",
        description: "d",
        subscriberCount: 4,
        openRate: 12.5,
        clickRate: 3.25,
      },
    ]);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT } }),
    );
  });

  it("finds by id inside the tenant and reports a missing segment", async () => {
    const { service, repository } = setup();
    await service.findOne("s1");
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: "s1", tenantId: TENANT },
    });
    repository.findOne.mockResolvedValueOnce(null as unknown as Segment);
    await expect(service.findOne("missing")).rejects.toThrow(NotFoundException);
  });

  it("updates and removes the tenant segment", async () => {
    const { service, repository, segment } = setup();
    await expect(
      service.update("s1", { name: "Renamed" } as never),
    ).resolves.toMatchObject({ name: "Renamed", tenantId: TENANT });
    await service.remove("s1");
    expect(repository.remove).toHaveBeenCalledWith(segment);
  });

  it("requires a tenant context and refuses another tenant", async () => {
    await expect(setup(null).service.findAll()).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(setup().service.findAll("tenant-b")).rejects.toThrow(
      ForbiddenException,
    );
  });
});
