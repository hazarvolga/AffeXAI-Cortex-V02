import * as puppeteer from "puppeteer";
import { PdfGeneratorService } from "./pdf-generator.service";
import { CertificateTemplate } from "./entities/certificate-template.entity";
import { S3Service } from "../media/s3.service";

jest.mock("puppeteer", () => ({ launch: jest.fn() }));
jest.mock("../media/s3.service", () => ({ S3Service: class {} }));

describe("Certificate PDF resource readiness", () => {
  afterEach(() => jest.restoreAllMocks());

  it("waits for page resources before rendering and uploading the tenant PDF", async () => {
    const operations: string[] = [];
    const page = {
      setRequestInterception: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      setContent: jest.fn(async () => {
        operations.push("content");
      }),
      waitForNetworkIdle: jest.fn(async () => {
        operations.push("resources");
      }),
      pdf: jest.fn(async () => {
        operations.push("pdf");
        return Buffer.from("pdf");
      }),
    };
    const browser = {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn(),
    };
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false } as Response);
    const uploadFile = jest
      .fn()
      .mockResolvedValue("https://storage.example/certificate.pdf");
    const service = new PdfGeneratorService({
      uploadFile,
    } as unknown as S3Service);

    await expect(
      service.generateCertificatePdf(
        {
          htmlContent: "<p>{{recipientName}}</p>",
          pageFormat: "A4",
          orientation: "portrait",
        } as CertificateTemplate,
        {
          recipientName: "Test User",
          recipientEmail: "test@example.com",
          trainingTitle: "Training",
          issuedAt: "2026-10-07",
        },
        "certificate-a",
        "tenant-a",
      ),
    ).resolves.toBe("https://storage.example/certificate.pdf");

    expect(operations).toEqual(["content", "resources", "pdf"]);
    expect(page.setContent).toHaveBeenCalledWith("<p>Test User</p>", {
      waitUntil: "load",
      timeout: 30000,
    });
    expect(page.waitForNetworkIdle).toHaveBeenCalledWith({ timeout: 30000 });
    expect(uploadFile).toHaveBeenCalledWith(
      expect.stringContaining("certificates/certificate-certificate-a-"),
      Buffer.from("pdf"),
      "application/pdf",
      "tenant-a",
    );
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it.each([
    "newPage",
    "setContent",
    "waitForNetworkIdle",
    "pdf",
    "waitAndClose",
  ])(
    "closes the browser and preserves the generation error when %s fails",
    async (stage) => {
      const failure = new Error("Resource generation failed");
      const page = {
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        setContent: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from("pdf")),
      };
      const browser = {
        newPage: jest.fn().mockResolvedValue(page),
        close: jest.fn().mockResolvedValue(undefined),
      };
      if (stage === "newPage") browser.newPage.mockRejectedValue(failure);
      else if (stage === "waitAndClose") {
        page.waitForNetworkIdle.mockRejectedValue(failure);
        browser.close.mockRejectedValue(new Error("Cleanup failed"));
      } else page[stage].mockRejectedValue(failure);

      (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
      jest.spyOn(global, "fetch").mockResolvedValue({ ok: false } as Response);
      const uploadFile = jest.fn();
      const service = new PdfGeneratorService({
        uploadFile,
      } as unknown as S3Service);

      await expect(
        service.generateCertificatePdf(
          { htmlContent: "<p>Certificate</p>" } as CertificateTemplate,
          {
            recipientName: "Test User",
            recipientEmail: "test@example.com",
            trainingTitle: "Training",
            issuedAt: "2026-10-07",
          },
          "certificate-a",
          "tenant-a",
        ),
      ).rejects.toThrow("PDF generation failed: Resource generation failed");

      expect(browser.close).toHaveBeenCalledTimes(1);
      expect(uploadFile).not.toHaveBeenCalled();
    },
  );
});
