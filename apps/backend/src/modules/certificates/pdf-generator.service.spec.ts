import * as puppeteer from "puppeteer";
import { S3Service } from "../media/s3.service";
import { CertificateTemplate } from "./entities/certificate-template.entity";
import {
  isAllowedRenderRequest,
  PdfGeneratorService,
  webUrlOrNull,
} from "./pdf-generator.service";

jest.mock("puppeteer", () => ({ launch: jest.fn() }));
jest.mock("../media/s3.service", () => ({ S3Service: class {} }));

type RequestHandler = (request: {
  url: () => string;
  continue: jest.Mock;
  abort: jest.Mock;
}) => void;

function browser() {
  let onRequest: RequestHandler | undefined;
  const page = {
    setRequestInterception: jest.fn(async () => undefined),
    on: jest.fn((_event: string, handler: RequestHandler) => {
      onRequest = handler;
    }),
    setContent: jest.fn(async () => undefined),
    waitForNetworkIdle: jest.fn(async () => undefined),
    pdf: jest.fn(async () => new Uint8Array([37, 80, 68, 70])),
  };
  const instance = {
    newPage: jest.fn(async () => page),
    close: jest.fn(async () => undefined),
  };
  (puppeteer.launch as jest.Mock).mockResolvedValue(instance);
  return {
    page,
    instance,
    request: (url: string) => {
      const request = { url: () => url, continue: jest.fn(), abort: jest.fn() };
      onRequest?.(request);
      return request;
    },
  };
}

function setup() {
  const s3 = {
    uploadFile: jest.fn(
      async () => "https://bucket.example.test/certificates/c1.pdf",
    ),
    deleteFile: jest.fn(async () => undefined),
  };
  const service = new PdfGeneratorService(s3 as unknown as S3Service);
  return { service, s3 };
}

const template = {
  htmlContent:
    '<h1>{{recipientName}}</h1><p>{{companyName}} · {{companyAddress}}</p><img src="{{logoUrl}}"><img src="{{signatureUrl}}">',
  pageFormat: "A4",
  orientation: "landscape",
} as CertificateTemplate;

describe("PdfGeneratorService", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders the caller-provided company data, uploads to the tenant and closes the browser", async () => {
    const { page, instance } = browser();
    const { service, s3 } = setup();
    const url = await service.generateCertificatePdf(
      template,
      {
        recipientName: "Ada",
        recipientEmail: null,
        trainingTitle: "Course",
        issuedAt: "2026-10-15T00:00:00Z",
        companyName: "XYZ Company",
        companyAddress: "Istanbul",
      },
      "c1",
      "tenant-a",
    );
    const [html] = page.setContent.mock.calls[0] as unknown as [string];
    expect(html).toContain("<h1>Ada</h1>");
    expect(html).toContain("XYZ Company · Istanbul");
    expect(page.pdf).toHaveBeenCalledWith(
      expect.objectContaining({ format: "A4", landscape: true }),
    );
    expect(s3.uploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^certificates\/certificate-c1-\d+\.pdf$/),
      expect.any(Buffer),
      "application/pdf",
      "tenant-a",
    );
    expect(instance.close).toHaveBeenCalled();
    expect(url).toBe("https://bucket.example.test/certificates/c1.pdf");
  });

  it("drops non-web asset URLs and blocks non-web requests while rendering", async () => {
    const { page, request } = browser();
    const { service } = setup();
    await service.generateCertificatePdf(
      template,
      {
        recipientName: "Ada",
        recipientEmail: null,
        trainingTitle: "Course",
        issuedAt: "2026-10-15T00:00:00Z",
        customLogoUrl: "file:///etc/passwd",
        signatureUrl: "http://169.254.169.254/latest",
      },
      "c1",
      "tenant-a",
    );
    const [html] = page.setContent.mock.calls[0] as unknown as [string];
    expect(html).not.toContain("file://");
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(request("file:///etc/passwd").abort).toHaveBeenCalled();
    expect(
      request("https://cdn.example.test/logo.png").continue,
    ).toHaveBeenCalled();
  });

  it("closes the browser and reports a render failure", async () => {
    const { page, instance } = browser();
    page.pdf.mockRejectedValueOnce(new Error("render crashed"));
    await expect(
      setup().service.generateCertificatePdf(
        template,
        {
          recipientName: "Ada",
          recipientEmail: null,
          trainingTitle: "C",
          issuedAt: "2026-10-15",
        },
        "c1",
        "tenant-a",
      ),
    ).rejects.toThrow("PDF generation failed: render crashed");
    expect(instance.close).toHaveBeenCalled();
  });

  it("deletes by the S3 key inside the tenant", async () => {
    const { service, s3 } = setup();
    await service.deletePdf(
      "https://s3.example.test/bucket/certificates/c1.pdf",
      "tenant-a",
    );
    expect(s3.deleteFile).toHaveBeenCalledWith(
      "certificates/c1.pdf",
      "tenant-a",
    );
  });

  it("accepts only web URLs for assets and requests", () => {
    expect(webUrlOrNull("https://cdn.example.test/a.png")).toBe(
      "https://cdn.example.test/a.png",
    );
    expect(webUrlOrNull("file:///etc/passwd")).toBeNull();
    expect(webUrlOrNull("javascript:alert(1)")).toBeNull();
    expect(webUrlOrNull("")).toBeNull();
    expect(isAllowedRenderRequest("data:image/png;base64,xx")).toBe(true);
    expect(isAllowedRenderRequest("chrome://settings")).toBe(false);
  });
});
