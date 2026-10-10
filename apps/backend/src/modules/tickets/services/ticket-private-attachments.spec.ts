import { mkdtemp, readdir, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { TicketAttachmentService } from "./ticket-attachment.service";
import { TenantService } from "../../../core/tenant/tenant.service";

describe("private ticket attachment bytes and authority", () => {
  let root: string;
  let service: TicketAttachmentService;
  const owner = {
    id: randomUUID(),
    tenantId: "tenant-a",
    roleNames: ["customer"],
  };
  const tenants = new TenantService();
  const records = new Map();
  const repo = {
    create: jest.fn((value) => ({
      ...value,
      id: randomUUID(),
      createdAt: new Date(),
    })),
    save: jest.fn(async (value) => {
      records.set(value.id, value);
      return value;
    }),
    findOne: jest.fn(async ({ where }) => {
      const row = records.get(where.id);
      return row?.tenantId === where.tenantId ? row : null;
    }),
  };
  const tickets = { findOne: jest.fn() };
  const messages = { findOne: jest.fn() };
  const run = <T>(callback: () => T): T =>
    tenants.runWithTenant(
      { tenantId: owner.tenantId, source: "authenticated" },
      callback,
    );
  const file = (
    name = "fixture.txt",
    buffer: Buffer<ArrayBufferLike> = Buffer.from("private fixture bytes"),
    mimetype = "text/plain",
  ) =>
    ({
      originalname: name,
      buffer,
      size: buffer.length,
      mimetype,
    }) as Express.Multer.File;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "affexai-private-attachment-"));
    records.clear();
    jest.clearAllMocks();
    service = new TicketAttachmentService(
      repo as never,
      tickets as never,
      messages as never,
      tenants,
      { get: () => root } as never,
    );
  });
  afterEach(async () => rm(root, { recursive: true, force: true }));
  it("persists exact private bytes and returns an authenticated download URL", async () => {
    const result = await run(() => service.uploadAttachment(file(), owner));
    expect(result.url).toBe(`/api/tickets/attachments/${result.id}/download`);
    const stored = records.get(result.id);
    expect(await readFile(join(root, stored.storageKey))).toEqual(
      file().buffer,
    );
    expect(result).not.toHaveProperty("storageKey");
  });
  it("does not permit foreign owners, even staff, to read unbound drafts", async () => {
    const result = await run(() => service.uploadAttachment(file(), owner));
    await expect(
      run(() =>
        service.getAttachment(result.id, {
          ...owner,
          id: randomUUID(),
          roleNames: ["admin"],
        }),
      ),
    ).rejects.toThrow();
  });
  it("rejects foreign tenant before retrieving content", async () => {
    const result = await run(() => service.uploadAttachment(file(), owner));
    await expect(
      run(() =>
        service.getAttachment(result.id, { ...owner, tenantId: "tenant-b" }),
      ),
    ).rejects.toThrow();
  });
  it("removes bytes if metadata persistence fails", async () => {
    repo.save.mockRejectedValueOnce(new Error("fixture db failure"));
    await expect(
      run(() => service.uploadAttachment(file(), owner)),
    ).rejects.toThrow("fixture db failure");
    expect(await readdir(root)).toEqual([]);
  });
  it.each([
    ["fake.pdf", Buffer.from("not pdf"), "application/pdf"],
    ["fake.png", Buffer.from("not png"), "image/png"],
    ["bad.html", Buffer.from("<script>x</script>"), "text/html"],
    ["bad.txt", Buffer.from([0, 1, 2]), "text/plain"],
  ])("rejects unsafe extension/signature %s", async (name, bytes, mime) => {
    await expect(
      run(() =>
        service.uploadAttachment(
          file(name as string, bytes, mime as string),
          owner,
        ),
      ),
    ).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("denies internal-message attachments to ticket customer even if they know the attachment id", async () => {
    const result = await run(() => service.uploadAttachment(file(), owner));
    const row = records.get(result.id);
    row.ticketId = randomUUID();
    row.messageId = randomUUID();
    tickets.findOne.mockResolvedValue({
      id: row.ticketId,
      tenantId: owner.tenantId,
      userId: owner.id,
    });
    messages.findOne.mockResolvedValue({
      id: row.messageId,
      ticketId: row.ticketId,
      tenantId: owner.tenantId,
      isInternal: true,
    });
    await expect(
      run(() => service.getAttachment(result.id, owner)),
    ).rejects.toThrow();
  });
});
