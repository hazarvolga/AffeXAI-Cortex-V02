import { randomUUID } from "node:crypto";
import { TicketTemplatesService } from "./ticket-templates.service";
import { TicketPriority } from "../enums/ticket-priority.enum";
describe("ticket template owner and tenant boundary", () => {
  const owner = {
    id: randomUUID(),
    tenantId: "tenant-a",
    roleNames: ["editor"],
  };
  const customer = {
    id: randomUUID(),
    tenantId: "tenant-a",
    roleNames: ["customer"],
  };
  const row = {
    id: randomUUID(),
    tenantId: "tenant-a",
    createdById: owner.id,
    isPublic: false,
    isActive: true,
    name: "Private",
    subject: "Subject",
    content: "Content",
    priority: TicketPriority.MEDIUM,
  };
  const repo = {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ ...value, id: row.id })),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
    manager: { findOne: jest.fn().mockResolvedValue(null) },
  };
  const service = new TicketTemplatesService(
    repo as never,
    { getTenantId: () => "tenant-a" } as never,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue({ ...row });
  });
  it("denies another customer private template detail", async () => {
    await expect(service.findOne(row.id, customer)).rejects.toThrow();
  });
  it("denies another editor private template detail", async () => {
    await expect(
      service.findOne(row.id, { ...customer, roleNames: ["editor"] }),
    ).rejects.toThrow();
  });
  it("denies mismatched actor tenant before repository", async () => {
    await expect(
      service.findOne(row.id, { ...owner, tenantId: "tenant-b" }),
    ).rejects.toThrow();
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it("fails closed without tenant", async () => {
    const missing = new TicketTemplatesService(
      repo as never,
      { getTenantId: () => undefined } as never,
    );
    await expect(missing.findOne(row.id, owner)).rejects.toThrow();
    expect(repo.findOne).not.toHaveBeenCalled();
  });
  it("list filters public or own and never arbitrary private", async () => {
    await service.findAll(customer);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          { tenantId: "tenant-a", isActive: true, isPublic: true },
          { tenantId: "tenant-a", isActive: true, createdById: customer.id },
        ],
      }),
    );
  });
  it("cannot increment another owner private template", async () => {
    await expect(service.incrementUsage(row.id, customer)).rejects.toThrow();
    expect(repo.increment).not.toHaveBeenCalled();
  });
  it("rejects tenant/owner metadata injection", async () => {
    await expect(
      service.update(row.id, { tenantId: "tenant-b" } as never, owner),
    ).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });
  it("rejects foreign category on creation", async () => {
    await expect(
      service.create(
        {
          name: "New",
          subject: "Subject",
          content: "Body",
          categoryId: randomUUID(),
        },
        owner,
      ),
    ).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("customer cannot create template", async () => {
    await expect(
      service.create(
        { name: "New", subject: "Subject", content: "Body" },
        customer,
      ),
    ).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("returns only safe creator identity", async () => {
    repo.findOne.mockResolvedValue({
      ...row,
      createdBy: {
        id: owner.id,
        firstName: "Ada",
        email: "private",
        password: "secret",
      },
    });
    const result = await service.findOne(row.id, owner);
    expect(result.createdBy).toEqual({
      id: owner.id,
      firstName: "Ada",
      lastName: undefined,
      avatar: undefined,
    });
  });
});
