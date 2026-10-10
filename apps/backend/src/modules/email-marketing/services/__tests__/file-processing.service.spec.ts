import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileProcessingService } from '../file-processing.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileProcessingService', () => {
  let service: FileProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileProcessingService],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateFileType', () => {
    it('should validate CSV file successfully', async () => {
      const mockFile = {
        originalname: 'test.csv',
        mimetype: 'text/csv',
        size: 1024,
        buffer: Buffer.from('email,name\ntest@example.com,Test User')
      } as any;

      const result = await service.validateFileType(mockFile);

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('text/csv');
      expect(result.fileSize).toBe(1024);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject file that is too large', async () => {
      const mockFile = {
        originalname: 'large.csv',
        mimetype: 'text/csv',
        size: 100 * 1024 * 1024, // 100MB
        buffer: Buffer.from('test')
      } as any;

      const result = await service.validateFileType(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('exceeds maximum allowed size'));
    });

    it('should reject unsupported file type', async () => {
      const mockFile = {
        originalname: 'test.exe',
        mimetype: 'application/x-executable',
        size: 1024,
        buffer: Buffer.from('test')
      } as any;

      const result = await service.validateFileType(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('is not allowed'));
    });
  });

  describe('detectColumns', () => {
    it('should detect email column correctly', async () => {
      const csvData = [
        { email: 'test1@example.com', name: 'Test 1' },
        { email: 'test2@example.com', name: 'Test 2' },
        { email: 'test3@example.com', name: 'Test 3' }
      ];

      const result = await service.detectColumns(csvData);

      expect(result.detectedColumns).toHaveLength(2);
      
      const emailColumn = result.detectedColumns.find(col => col.name === 'email');
      expect(emailColumn?.type).toBe('email');
      
      const nameColumn = result.detectedColumns.find(col => col.name === 'name');
      expect(nameColumn?.type).toBe('text');
    });

    it('should suggest field mappings', async () => {
      const csvData = [
        { 'Email Address': 'test1@example.com', 'First Name': 'Test' },
        { 'Email Address': 'test2@example.com', 'First Name': 'User' }
      ];

      const result = await service.detectColumns(csvData);

      expect(result.suggestions).toHaveLength(2);
      
      const emailSuggestion = result.suggestions.find(s => s.suggestedField === 'email');
      expect(emailSuggestion).toBeDefined();
      expect(emailSuggestion?.confidence).toBeGreaterThan(0.7);
      
      const firstNameSuggestion = result.suggestions.find(s => s.suggestedField === 'firstName');
      expect(firstNameSuggestion).toBeDefined();
    });
  });

  describe('validateColumnMapping', () => {
    it('should validate correct mapping', async () => {
      const mapping = {
        'Email Address': 'email',
        'First Name': 'firstName',
        'Company': 'company'
      };

      const result = await service.validateColumnMapping(mapping);
      expect(result).toBe(true);
    });

    it('should reject mapping without required email field', async () => {
      const mapping = {
        'First Name': 'firstName',
        'Company': 'company'
      };

      const result = await service.validateColumnMapping(mapping);
      expect(result).toBe(false);
    });

    it('should reject mapping with invalid field', async () => {
      const mapping = {
        'Email Address': 'email',
        'Invalid Field': 'invalidField'
      };

      const result = await service.validateColumnMapping(mapping);
      expect(result).toBe(false);
    });
  });

  describe('generateSecureFilePath', () => {
    it('should generate secure file path', () => {
      const originalFileName = 'test file.csv';
      const jobId = 'test-job-123';

      const result = service.generateSecureFilePath(originalFileName, jobId);

      expect(result).toContain('temp/imports/test-job-123');
      expect(result).toContain('test_file.csv');
      expect(result).not.toContain(' '); // Spaces should be replaced
    });

    it('should sanitize dangerous file names', () => {
      const dangerousFileName = '../../../etc/passwd';
      const jobId = 'test-job-123';

      const result = service.generateSecureFilePath(dangerousFileName, jobId);

      expect(result).not.toContain('../');
      expect(result).toContain('___etc_passwd');
    });
  });

  describe('scanForMalware', () => {
    it('should pass clean CSV content', async () => {
      // Create a temporary clean CSV file
      const tempDir = path.join(__dirname, 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const cleanCsvPath = path.join(tempDir, 'clean.csv');
      await fs.writeFile(cleanCsvPath, 'email,name\ntest@example.com,Test User');

      const result = await service.scanForMalware(cleanCsvPath);

      expect(result).toBe(true);

      // Cleanup
      await fs.unlink(cleanCsvPath);
      await fs.rmdir(tempDir);
    });

    it('should detect suspicious script content', async () => {
      // Create a temporary file with suspicious content
      const tempDir = path.join(__dirname, 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const suspiciousPath = path.join(tempDir, 'suspicious.csv');
      await fs.writeFile(suspiciousPath, 'email,name\n<script>alert("xss")</script>,Test User');

      const result = await service.scanForMalware(suspiciousPath);

      expect(result).toBe(false);

      // Cleanup
      await fs.unlink(suspiciousPath);
      await fs.rmdir(tempDir);
    });
  });
});