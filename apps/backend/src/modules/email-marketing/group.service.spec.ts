import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../core/tenant/tenant.service";
import { Group } from "./entities/group.entity";
import { GroupService } from "./group.service";

const TENANT = "tenant-a";

function setup(activeTenant: string | null = TENANT) {
  const group = {
    id: "g1",
    name: "Test Group",
    description: "d",
    tenantId: TENANT,
    subscriberCount: 3,
  } as Group;
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => [group]),
    findOne: jest.fn(async () => group),
    remove: jest.fn(async (value) => value),
  };
  const tenants = { getTenantId: jest.fn(() => activeTenant) };
  const service = new GroupService(
    repository as unknown as Repository<Group>,
    tenants as unknown as TenantService,
  );
  return { service, repository, group };
}

describe("GroupService", () => {
  it("creates the group in the active tenant", async () => {
    const { service, repository } = setup();
    await service.create({ name: "Test Group", description: "d" });
    expect(repository.create).toHaveBeenCalledWith({
      name: "Test Group",
      description: "d",
      tenantId: TENANT,
    });
  });

  it("rejects fields a caller may not write", async () => {
    const { service, repository } = setup();
    await expect(
      service.create({ name: "x", tenantId: "tenant-b" } as never),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("lists only the active tenant, ordered by name", async () => {
    const { service, repository } = setup();
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({
      where: { tenantId: TENANT },
      order: { name: "ASC" },
    });
  });

  it("maps import options with an empty description fallback", async () => {
    const { service, repository, group } = setup();
    repository.find.mockResolvedValueOnce([
      { ...group, description: null } as unknown as Group,
    ]);
    await expect(service.findAllForImport()).resolves.toEqual([
      { id: "g1", name: "Test Group", description: "", subscriberCount: 3 },
    ]);
  });

  it("finds by id inside the tenant and reports a missing group", async () => {
    const { service, repository } = setup();
    await service.findOne("g1");
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: "g1", tenantId: TENANT },
    });
    repository.findOne.mockResolvedValueOnce(null as unknown as Group);
    await expect(service.findOne("missing")).rejects.toThrow(NotFoundException);
  });

  it("updates and removes the tenant group", async () => {
    const { service, repository, group } = setup();
    await expect(
      service.update("g1", { name: "Updated" }),
    ).resolves.toMatchObject({ name: "Updated", tenantId: TENANT });
    await service.remove("g1");
    expect(repository.remove).toHaveBeenCalledWith(group);
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
