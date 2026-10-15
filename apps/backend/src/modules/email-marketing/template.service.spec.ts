import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { TenantService } from "../../core/tenant/tenant.service";
import { EmailTemplate, TemplateType } from "./entities/email-template.entity";
import { MjmlRendererService } from "./services/mjml-renderer.service";
import { TemplateService } from "./template.service";

jest.mock("./services/mjml-renderer.service", () => ({
  MjmlRendererService: class {},
}));

const TENANT = "tenant-a";

function setup(
  stored: Partial<EmailTemplate> | null = {
    id: "t1",
    name: "Welcome",
    content: "<p>Hi</p>",
    tenantId: TENANT,
  },
  tenant: string | null = TENANT,
) {
  const templates = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => [stored]),
    findOne: jest.fn(async () => stored),
    update: jest.fn(async () => ({ affected: 1 })),
    remove: jest.fn(async () => undefined),
  };
  const renderer = {
    renderEmail: jest.fn(async () => ({
      mjml: "<mjml/>",
      html: "<html/>",
      errors: [],
    })),
  };
  const service = new TemplateService(
    templates as unknown as Repository<EmailTemplate>,
    renderer as unknown as MjmlRendererService,
    { getTenantId: () => tenant } as unknown as TenantService,
  );
  return { service, templates, renderer };
}

describe("TemplateService", () => {
  it("creates and lists templates in the active tenant", async () => {
    const { service, templates } = setup();
    await service.create({ name: "Promo" } as never);
    expect(templates.create).toHaveBeenCalledWith({
      name: "Promo",
      tenantId: TENANT,
    });
    await service.findAll();
    expect(templates.find).toHaveBeenCalledWith({
      where: { tenantId: TENANT },
    });
  });

  it("keeps id and tenant when an update tries to change them", async () => {
    const { service } = setup();
    const updated = await service.update("t1", {
      name: "Renamed",
      id: "x",
      tenantId: "tenant-b",
    } as never);
    expect(updated).toMatchObject({
      id: "t1",
      name: "Renamed",
      tenantId: TENANT,
    });
  });

  it("clones an HTML-only template into an editable structured copy", async () => {
    const { service, templates, renderer } = setup();
    const clone = await service.cloneTemplate("t1", {} as never);
    expect(clone).toMatchObject({
      name: "Welcome (Copy)",
      type: TemplateType.CUSTOM,
      isEditable: true,
      createdFrom: "cloned",
      tenantId: TENANT,
      compiledHtml: "<html/>",
    });
    expect(clone.structure.rows[0].columns[0].blocks[0]).toMatchObject({
      type: "html",
      properties: { html: "<p>Hi</p>" },
    });
    expect(renderer.renderEmail).toHaveBeenCalledTimes(1);
    expect(templates.save).toHaveBeenCalled();
  });

  it("renders a structured template and stores the output inside the tenant", async () => {
    const { service, templates } = setup({
      id: "t1",
      tenantId: TENANT,
      structure: { rows: [], settings: {} },
    } as never);
    await expect(service.renderTemplate("t1")).resolves.toEqual({
      html: "<html/>",
      mjml: "<mjml/>",
    });
    expect(templates.update).toHaveBeenCalledWith(
      { id: "t1", tenantId: TENANT },
      { compiledHtml: "<html/>", compiledMjml: "<mjml/>" },
    );
  });

  it("returns legacy HTML without rendering", async () => {
    const { service, renderer } = setup();
    await expect(service.renderTemplate("t1")).resolves.toEqual({
      html: "<p>Hi</p>",
      mjml: null,
    });
    expect(renderer.renderEmail).not.toHaveBeenCalled();
  });

  it("reports a missing template and requires a tenant", async () => {
    await expect(setup(null).service.findByName("nope")).rejects.toThrow(
      NotFoundException,
    );
    await expect(setup(undefined, null).service.findAll()).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
