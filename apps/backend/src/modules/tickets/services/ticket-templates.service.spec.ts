import { randomUUID } from "node:crypto";
import { TicketTemplatesService } from "./ticket-templates.service";
import { TicketPriority } from "../enums/ticket-priority.enum";
import { User } from "../../users/entities/user.entity";

describe("TicketTemplatesService actual persistence contract", () => {
  const actor = {
    id: randomUUID(),
    tenantId: "tenant-a",
    roleNames: ["editor"],
  };
  const id = randomUUID(),
    categoryId = randomUUID();
  const base = {
    id,
    tenantId: "tenant-a",
    createdById: actor.id,
    name: "Password",
    subject: "Hello {{name}}",
    content: "Literal {{user.name}} / $& <text>",
    priority: TicketPriority.MEDIUM,
    isPublic: false,
    isActive: true,
    usageCount: 0,
  };
  let row: Record<string, unknown>;
  const updateQuery = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const repository = {
    create: jest.fn((value) => ({ ...base, ...value })),
    save: jest.fn(async (value) => {
      row = { ...value };
      return row;
    }),
    findOne: jest.fn(async () => ({ ...row })),
    find: jest.fn(async () => [{ ...row }]),
    update: jest.fn(async (_where, patch) => {
      row = {
        ...row,
        ...patch,
        ...(typeof patch.isActive === "function"
          ? { isActive: !row.isActive }
          : {}),
      };
      return { affected: 1 };
    }),
    createQueryBuilder: () => updateQuery,
    manager: {
      findOne: jest.fn(async (entity) =>
        entity === User
          ? { id: actor.id, tenantId: actor.tenantId }
          : { id: categoryId, tenantId: actor.tenantId, isActive: true },
      ),
    },
  };
  const service = new TicketTemplatesService(
    repository as never,
    { getTenantId: () => actor.tenantId } as never,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    row = { ...base };
  });
  it("lists active public or owned templates with stable ordering", async () => {
    expect(await service.findAll(actor)).toEqual([base]);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { usageCount: "DESC", name: "ASC" } }),
    );
  });
  it("private filter only returns current actor ownership scope", async () => {
    await service.findAll(actor, false);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          {
            tenantId: "tenant-a",
            isActive: true,
            isPublic: false,
            createdById: actor.id,
          },
        ],
      }),
    );
  });
  it("public filter includes only active public templates", async () => {
    await service.findAll(actor, true);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [{ tenantId: "tenant-a", isActive: true, isPublic: true }],
      }),
    );
  });
  it("loads own template by tenant and id", async () => {
    expect((await service.findOne(id, actor)).id).toBe(id);
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id, tenantId: "tenant-a" } }),
    );
  });
  it("rejects missing template", async () => {
    repository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(id, actor)).rejects.toThrow("not found");
  });
  it("allows customer reading public active template", async () => {
    row.isPublic = true;
    await expect(
      service.findOne(id, {
        ...actor,
        id: randomUUID(),
        roleNames: ["customer"],
      }),
    ).resolves.toBeDefined();
  });
  it("hides inactive templates from customers", async () => {
    row.isPublic = true;
    row.isActive = false;
    await expect(
      service.findOne(id, { ...actor, roleNames: ["customer"] }),
    ).rejects.toThrow();
  });
  it("preserves literal variables without claiming unsupported rendering", async () => {
    const result = await service.create(
      {
        name: "Fixture",
        subject: "{{name}}",
        content: "{{user.name}} {{missing}} $& <text>",
      },
      actor,
    );
    expect(result.content).toBe("{{user.name}} {{missing}} $& <text>");
    expect(result.subject).toBe("{{name}}");
  });
  it("creates with verified creator and tenant only", async () => {
    await service.create(
      { name: "Fixture", subject: "Subject", content: "Body", categoryId },
      actor,
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        createdById: actor.id,
        tenantId: "tenant-a",
        categoryId,
      }),
    );
  });
  it("validates creator exists in current tenant", async () => {
    repository.manager.findOne.mockResolvedValueOnce(null);
    await expect(
      service.create(
        { name: "Fixture", subject: "Subject", content: "Body" },
        actor,
      ),
    ).rejects.toThrow("Creator unavailable");
  });
  it("partial update leaves other fields unchanged and avoids fullsave", async () => {
    const result = await service.update(id, { content: "Updated" }, actor);
    expect(result.subject).toBe(base.subject);
    expect(repository.update).toHaveBeenCalledWith(
      { id, tenantId: "tenant-a", createdById: actor.id },
      { content: "Updated" },
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
  it("preserves empty optional description", async () => {
    expect(
      (await service.update(id, { description: "" }, actor)).description,
    ).toBe("");
  });
  it("soft deletes by scoped partial active flag", async () => {
    await service.delete(id, actor);
    expect(repository.update).toHaveBeenCalledWith(
      { id, tenantId: "tenant-a", createdById: actor.id },
      { isActive: false },
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
  it("delete rejects missing record", async () => {
    repository.findOne.mockResolvedValueOnce(null);
    await expect(service.delete(id, actor)).rejects.toThrow();
    expect(repository.update).not.toHaveBeenCalled();
  });
  it("toggle uses atomic SQL negation", async () => {
    expect((await service.toggle(id, actor)).isActive).toBe(false);
    expect(repository.update).toHaveBeenCalledWith(
      { id, tenantId: "tenant-a", createdById: actor.id },
      { isActive: expect.any(Function) },
    );
  });
  it("usage count update retains tenant ownership/public visibility predicate", async () => {
    await service.incrementUsage(id, actor);
    expect(updateQuery.where).toHaveBeenCalledWith([
      { id, tenantId: "tenant-a", isActive: true, isPublic: true },
      { id, tenantId: "tenant-a", isActive: true, createdById: actor.id },
    ]);
  });
  it("usage update fails if visibility changed concurrently", async () => {
    updateQuery.execute.mockResolvedValueOnce({ affected: 0 });
    await expect(service.incrementUsage(id, actor)).rejects.toThrow();
  });
  it("category list preserves visibility scope", async () => {
    await service.findByCategory(categoryId, actor);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          { tenantId: "tenant-a", isActive: true, isPublic: true, categoryId },
          {
            tenantId: "tenant-a",
            isActive: true,
            createdById: actor.id,
            categoryId,
          },
        ],
      }),
    );
  });
  it("my templates always uses verified user id", async () => {
    await service.findByUser(actor);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-a", isActive: true, createdById: actor.id },
      }),
    );
  });
  it("popular list excludes private templates", async () => {
    await service.getPopular(actor, 5);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [{ tenantId: "tenant-a", isActive: true, isPublic: true }],
        take: 5,
      }),
    );
  });
  it.each([0, -1, 101, 1.5])(
    "rejects invalid popular bound %s",
    async (limit) => {
      await expect(service.getPopular(actor, limit)).rejects.toThrow();
    },
  );
  it("search uses bounded case insensitive clauses with visibility scope", async () => {
    await service.search("password", actor);
    const options = (repository.find as jest.Mock).mock.calls[0][0] as {
      where: Array<{ tenantId: string }>;
      take: number;
    };
    expect(options.where).toHaveLength(6);
    expect(options.take).toBe(100);
    for (const where of options.where) expect(where.tenantId).toBe("tenant-a");
  });
  it.each(["", "x".repeat(501)])(
    "rejects invalid search input",
    async (query) => {
      await expect(service.search(query, actor)).rejects.toThrow();
    },
  );
  it.each([
    { name: 4 },
    { name: "x".repeat(256) },
    { isPublic: "true" },
    { priority: "invalid" },
    { defaultTags: [3] },
    { customFields: [] },
    { categoryId: "bad" },
    { usageCount: 9 },
    { createdById: randomUUID() },
  ])("rejects invalid or protected fields %j", async (data) => {
    await expect(service.update(id, data as never, actor)).rejects.toThrow();
    expect(repository.update).not.toHaveBeenCalled();
  });
  it("valid fields persist priority, tags and custom fields", async () => {
    const result = await service.update(
      id,
      {
        priority: TicketPriority.HIGH,
        defaultTags: ["help"],
        customFields: { safe: "text" },
      },
      actor,
    );
    expect(result.defaultTags).toEqual(["help"]);
  });
  it.each([{ name: "" }, { subject: "  " }, { content: "" }])(
    "rejects explicitly blank required text %j",
    async (data) => {
      await expect(service.update(id, data, actor)).rejects.toThrow();
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
  it.each(['delete','toggle'] as const)('does not acknowledge %s after concurrent visibility loss',async action=>{repository.update.mockResolvedValueOnce({affected:0});await expect(service[action](id,actor)).rejects.toThrow('not found');});
});
