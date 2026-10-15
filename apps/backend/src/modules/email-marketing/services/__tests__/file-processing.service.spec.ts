import { Test, TestingModule } from "@nestjs/testing";
import { FileProcessingService } from "../file-processing.service";
import { EnhancedFileSecurityService } from "../enhanced-file-security.service";
import { CustomFieldService } from "../custom-field.service";
import { S3Service } from "../../../media/s3.service";
import * as path from "path";

// file-type is ESM-only; Jest's CommonJS runtime cannot load it.
jest.mock(
  "file-type",
  () => ({ fileTypeFromBuffer: jest.fn(async () => undefined) }),
  { virtual: true },
);

describe("FileProcessingService", () => {
  let service: FileProcessingService;
  const security = { performAdvancedMalwareScan: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingService,
        { provide: EnhancedFileSecurityService, useValue: security },
        {
          provide: CustomFieldService,
          useValue: {
            getFieldsForMapping: jest.fn(async () =>
              ["email", "firstName", "lastName", "company"].map((key) => ({
                key,
                label: key,
                required: key === "email",
                type: "text",
              })),
            ),
          },
        },
        { provide: S3Service, useValue: {} },
      ],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateFileType", () => {
    it("should validate CSV file successfully", async () => {
      const mockFile = {
        originalname: "test.csv",
        mimetype: "text/csv",
        size: 1024,
        buffer: Buffer.from("email,name\ntest@example.com,Test User"),
      } as any;

      const result = await service.validateFileType(mockFile);

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe("text/csv");
      expect(result.fileSize).toBe(1024);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject file that is too large", async () => {
      const mockFile = {
        originalname: "large.csv",
        mimetype: "text/csv",
        size: 100 * 1024 * 1024, // 100MB
        buffer: Buffer.from("test"),
      } as any;

      const result = await service.validateFileType(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("exceeds maximum allowed size"),
      );
    });

    it("should reject unsupported file type", async () => {
      const mockFile = {
        originalname: "test.exe",
        mimetype: "application/x-executable",
        size: 1024,
        buffer: Buffer.from("test"),
      } as any;

      const result = await service.validateFileType(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("is not allowed"),
      );
    });
  });

  describe("detectColumns", () => {
    it("should detect email column correctly", async () => {
      const csvData = [
        { email: "test1@example.com", name: "Test 1" },
        { email: "test2@example.com", name: "Test 2" },
        { email: "test3@example.com", name: "Test 3" },
      ];

      const result = await service.detectColumns(csvData);

      expect(result.detectedColumns).toHaveLength(2);

      const emailColumn = result.detectedColumns.find(
        (col) => col.name === "email",
      );
      expect(emailColumn?.type).toBe("email");

      const nameColumn = result.detectedColumns.find(
        (col) => col.name === "name",
      );
      expect(nameColumn?.type).toBe("text");
    });

    it("should suggest field mappings", async () => {
      const csvData = [
        { "Email Address": "test1@example.com", "First Name": "Test" },
        { "Email Address": "test2@example.com", "First Name": "User" },
      ];

      const result = await service.detectColumns(csvData);

      expect(result.suggestions).toHaveLength(2);

      const emailSuggestion = result.suggestions.find(
        (s) => s.suggestedField === "email",
      );
      expect(emailSuggestion).toBeDefined();
      expect(emailSuggestion?.confidence).toBeGreaterThan(0.7);

      const firstNameSuggestion = result.suggestions.find(
        (s) => s.suggestedField === "firstName",
      );
      expect(firstNameSuggestion).toBeDefined();
    });
  });

  describe("validateColumnMapping", () => {
    it("requires a mapped email and known target fields", async () => {
      expect(
        await service.validateColumnMapping({
          "Email Address": "email",
          "First Name": "firstName",
          Company: "company",
        }),
      ).toBe(true);
      expect(
        await service.validateColumnMapping({
          "First Name": "firstName",
          Company: "company",
        }),
      ).toBe(false);
      expect(
        await service.validateColumnMapping({
          "Email Address": "email",
          "Invalid Field": "invalidField",
        }),
      ).toBe(false);
    });
  });

  describe("detectColumns date handling", () => {
    it("recognises ISO and day-first dates but not free text with numbers", async () => {
      const result = await service.detectColumns([
        { joined: "2026-10-15", local: "15.10.2026", label: "Test 1" },
        { joined: "2026-10-16", local: "16.10.2026", label: "Test 2" },
      ]);
      const types = Object.fromEntries(
        result.detectedColumns.map((column) => [column.name, column.type]),
      );
      expect(types).toEqual({ joined: "date", local: "date", label: "text" });
    });
  });

  describe("generateSecureFilePath", () => {
    it("keeps the file inside the job folder and replaces whitespace", () => {
      const result = service.generateSecureFilePath(
        "test file.csv",
        "test-job-123",
      );
      expect(result).toContain(path.join("temp", "imports", "test-job-123"));
      expect(result).toMatch(/test_file\.csv$/);
      expect(result).not.toContain(" ");
    });

    it("neutralises path traversal in the file name", () => {
      const result = service.generateSecureFilePath(
        "../../../etc/passwd",
        "test-job-123",
      );
      expect(result).not.toContain("../");
      expect(path.basename(result)).toContain("___etc_passwd");
    });
  });

  describe("scanForMalware", () => {
    it("passes a file the scanner reports clean", async () => {
      security.performAdvancedMalwareScan.mockResolvedValueOnce({
        isClean: true,
        threats: [],
      });
      await expect(service.scanForMalware("/tmp/clean.csv")).resolves.toBe(
        true,
      );
      expect(security.performAdvancedMalwareScan).toHaveBeenCalledWith(
        "/tmp/clean.csv",
      );
    });

    it("rejects a file with threats", async () => {
      security.performAdvancedMalwareScan.mockResolvedValueOnce({
        isClean: false,
        threats: ["script"],
      });
      await expect(service.scanForMalware("/tmp/suspicious.csv")).resolves.toBe(
        false,
      );
    });

    it("fails closed when the scanner errors", async () => {
      security.performAdvancedMalwareScan.mockRejectedValueOnce(
        new Error("scanner down"),
      );
      await expect(service.scanForMalware("/tmp/any.csv")).resolves.toBe(false);
    });
  });
});
