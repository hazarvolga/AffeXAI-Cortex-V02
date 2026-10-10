import { ImportJob, ImportJobStatus } from '../import-job.entity';
import { ExportJob, ExportJobStatus } from '../export-job.entity';
import { ImportResult, ImportResultStatus } from '../import-result.entity';
import { SubscriberStatus } from '@affexai/shared-types';

describe('Bulk Import/Export Entities', () => {
  describe('ImportJob Entity', () => {
    it('should create an ImportJob instance with default values', () => {
      const importJob = new ImportJob();
      importJob.fileName = 'test-import.csv';
      importJob.originalFileName = 'subscribers.csv';
      importJob.filePath = '/uploads/test-import.csv';
      importJob.status = ImportJobStatus.PENDING;

      expect(importJob.fileName).toBe('test-import.csv');
      expect(importJob.originalFileName).toBe('subscribers.csv');
      expect(importJob.filePath).toBe('/uploads/test-import.csv');
      expect(importJob.status).toBe(ImportJobStatus.PENDING);
      expect(importJob.totalRecords).toBe(0);
      expect(importJob.processedRecords).toBe(0);
      expect(importJob.validRecords).toBe(0);
      expect(importJob.invalidRecords).toBe(0);
      expect(importJob.riskyRecords).toBe(0);
      expect(importJob.duplicateRecords).toBe(0);
      expect(importJob.progressPercentage).toBe(0);
    });

    it('should handle options and column mapping', () => {
      const importJob = new ImportJob();
      importJob.options = {
        groupIds: ['group1', 'group2'],
        segmentIds: ['segment1'],
        duplicateHandling: 'update',
        validationThreshold: 80,
        batchSize: 1000,
        columnMapping: { 'Email': 'email', 'First Name': 'firstName' }
      };
      importJob.columnMapping = { 'Email': 'email', 'First Name': 'firstName' };

      expect(importJob.options?.groupIds).toEqual(['group1', 'group2']);
      expect(importJob.options?.duplicateHandling).toBe('update');
      expect(importJob.options?.validationThreshold).toBe(80);
      expect(importJob.columnMapping).toEqual({ 'Email': 'email', 'First Name': 'firstName' });
    });
  });

  describe('ExportJob Entity', () => {
    it('should create an ExportJob instance with default values', () => {
      const exportJob = new ExportJob();
      exportJob.fileName = 'export-subscribers.csv';
      exportJob.filePath = '/exports/export-subscribers.csv';
      exportJob.status = ExportJobStatus.PENDING;
      exportJob.filters = { status: [SubscriberStatus.ACTIVE] };
      exportJob.options = { fields: ['email', 'firstName'], format: 'csv', includeMetadata: false, batchSize: 1000 };
      exportJob.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      expect(exportJob.fileName).toBe('export-subscribers.csv');
      expect(exportJob.filePath).toBe('/exports/export-subscribers.csv');
      expect(exportJob.status).toBe(ExportJobStatus.PENDING);
      expect(exportJob.totalRecords).toBe(0);
      expect(exportJob.processedRecords).toBe(0);
      expect(exportJob.progressPercentage).toBe(0);
      expect(exportJob.filters).toEqual({ status: ['active'] });
      expect(exportJob.options.format).toBe('csv');
      expect(exportJob.options.fields).toEqual(['email', 'firstName']);
    });
  });

  describe('ImportResult Entity', () => {
    it('should create an ImportResult instance', () => {
      const importResult = new ImportResult();
      importResult.importJobId = 'job-123';
      importResult.email = 'test@example.com';
      importResult.status = ImportResultStatus.VALID;
      importResult.confidenceScore = 95;
      importResult.issues = [];
      importResult.suggestions = [];
      importResult.imported = false;
      importResult.rowNumber = 1;

      expect(importResult.importJobId).toBe('job-123');
      expect(importResult.email).toBe('test@example.com');
      expect(importResult.status).toBe(ImportResultStatus.VALID);
      expect(importResult.confidenceScore).toBe(95);
      expect(importResult.imported).toBe(false);
      expect(importResult.rowNumber).toBe(1);
    });

    it('should handle validation details', () => {
      const importResult = new ImportResult();
      importResult.validationDetails = {
        syntaxValid: true,
        domainExists: true,
        mxRecordExists: true,
        isDisposable: false,
        isRoleAccount: false,
        hasTypos: false,
        ipReputation: 'good',
        confidenceScore: 95,
        validationProvider: 'advanced-validation',
        validatedAt: new Date()
      };

      expect(importResult.validationDetails?.syntaxValid).toBe(true);
      expect(importResult.validationDetails?.domainExists).toBe(true);
      expect(importResult.validationDetails?.ipReputation).toBe('good');
      expect(importResult.validationDetails?.confidenceScore).toBe(95);
    });
  });
});