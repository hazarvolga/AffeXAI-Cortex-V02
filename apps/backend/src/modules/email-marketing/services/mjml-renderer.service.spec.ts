import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TenantService } from "../../../core/tenant/tenant.service";
import { SettingsService } from "../../settings/settings.service";
import { EmailStructure, MjmlRendererService } from "./mjml-renderer.service";

type Block = EmailStructure["rows"][0]["columns"][0]["blocks"][0];

const block = (
  type: string,
  properties: Record<string, unknown>,
  styles: Record<string, unknown> = {},
): Block => ({
  id: `${type}-1`,
  type,
  properties,
  styles,
});

const structure = (...columns: Block[][]): EmailStructure => ({
  rows: [
    {
      id: "row-1",
      type: "section",
      settings: {},
      columns: columns.map((blocks, index) => ({
        id: `col-${index}`,
        width: `${100 / columns.length}%`,
        blocks,
      })),
    },
  ],
  settings: { backgroundColor: "#f4f4f4" },
});

function setup(tenant: string | null = "tenant-a") {
  const settings = {
    getSiteSettings: jest.fn(async () => ({
      companyName: "XYZ Company",
      logoUrl: "https://cdn.example.com/logo.png",
      contact: { email: "hello@xyz.test" },
    })),
  };
  const config = { get: jest.fn(() => undefined) };
  const tenants = { getTenantId: jest.fn(() => tenant) };
  const service = new MjmlRendererService(
    settings as unknown as SettingsService,
    config as unknown as ConfigService,
    tenants as unknown as TenantService,
  );
  return { service, settings };
}

describe("MjmlRendererService", () => {
  it("renders text, image and button blocks to HTML", async () => {
    const { service } = setup();
    const { html, errors } = await service.renderEmail(
      structure([
        block("text", { content: "Hello World" }),
        block("image", {
          src: "https://example.com/image.jpg",
          alt: "Test Image",
        }),
        block("button", {
          content: "Click Me",
          href: "https://example.com/go",
        }),
      ]),
      { skipHeaderFooter: true },
    );
    expect(errors).toEqual([]);
    expect(html).toContain("Hello World");
    expect(html).toContain("https://example.com/image.jpg");
    expect(html).toContain("Test Image");
    expect(html).toContain("Click Me");
    expect(html).toContain("https://example.com/go");
  });

  it("carries block styles into the MJML", async () => {
    const { service } = setup();
    const { mjml } = await service.renderEmail(
      structure([
        block(
          "heading",
          { content: "Title" },
          { color: "#FF0000", fontSize: "20px" },
        ),
      ]),
      { skipHeaderFooter: true },
    );
    expect(mjml).toContain('color="#FF0000"');
    expect(mjml).toContain('font-size="20px"');
    expect(mjml).toContain('background-color="#f4f4f4"');
  });

  it("renders one column per entry", async () => {
    const { service } = setup();
    const { html, mjml } = await service.renderEmail(
      structure(
        [block("text", { content: "Column 1" })],
        [block("text", { content: "Column 2" })],
      ),
      { skipHeaderFooter: true },
    );
    expect(html).toContain("Column 1");
    expect(html).toContain("Column 2");
    expect(mjml.match(/<mj-column/g)).toHaveLength(2);
  });

  it("wraps the content in the tenant header and footer without mutating the input", async () => {
    const { service, settings } = setup();
    const input = structure([block("text", { content: "Body" })]);
    const { html } = await service.renderEmail(input);
    expect(settings.getSiteSettings).toHaveBeenCalledWith("tenant-a");
    expect(html).toContain("https://cdn.example.com/logo.png");
    expect(html).toContain("XYZ Company");
    expect(input.rows).toHaveLength(1);
  });

  it("skips unknown blocks instead of emitting broken markup", async () => {
    const { service } = setup();
    const { mjml } = await service.renderEmail(
      structure([block("carousel", {})]),
      { skipHeaderFooter: true },
    );
    expect(mjml).not.toContain("carousel");
  });

  it("requires a tenant context", async () => {
    await expect(
      setup(null).service.renderEmail(structure([])),
    ).rejects.toThrow(UnauthorizedException);
  });
});
