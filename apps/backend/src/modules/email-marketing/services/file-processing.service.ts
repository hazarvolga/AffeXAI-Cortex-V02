import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import { fileTypeFromBuffer } from 'file-type';
import { createReadStream } from 'fs';
import * as crypto from 'crypto';
import { EnhancedFileSecurityService, FileSecurityReport } from './enhanced-file-security.service';
import { CustomFieldService } from './custom-field.service';
import { S3Service } from '../../media/s3.service';

export interface CsvParseResult {
  headers: string[];
  data: any[];
  totalRows: number;
  errors: ParseError[];
}

export interface ParseError {
  row: number;
  message: string;
  code: string;
}

export interface ColumnDetectionResult {
  detectedColumns: DetectedColumn[];
  suggestions: ColumnSuggestion[];
  confidence: number;
}

export interface DetectedColumn {
  name: string;
  type: 'email' | 'text' | 'number' | 'date' | 'unknown';
  samples: string[];
  nullCount: number;
  uniqueCount: number;
}

export interface ColumnSuggestion {
  csvColumn: string;
  suggestedField: string;
  confidence: number;
  reason: string;
}

export interface FileValidationResult {
  isValid: boolean;
  fileType: string;
  fileSize: number;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  constructor(
    private readonly enhancedSecurityService: EnhancedFileSecurityService,
    private readonly customFieldService: CustomFieldService,
    private readonly s3Service: S3Service
  ) { }

  // Allowed file types for upload
  private readonly ALLOWED_MIME_TYPES = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Maximum file size (50MB)
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Known field mappings for auto-detection
  private readonly FIELD_PATTERNS = {
    email: [
      /^e?-?mail$/i,
      /^email.*address$/i,
      /^contact.*email$/i,
      /^user.*email$/i,
      /^subscriber.*email$/i
    ],
    firstName: [
      /^first.*name$/i,
      /^fname$/i,
      /^given.*name$/i,
      /^forename$/i
    ],
    lastName: [
      /^last.*name$/i,
      /^lname$/i,
      /^surname$/i,
      /^family.*name$/i
    ],
    phone: [
      /^phone$/i,
      /^telephone$/i,
      /^mobile$/i,
      /^cell$/i,
      /^contact.*number$/i
    ],
    company: [
      /^company$/i,
      /^organization$/i,
      /^org$/i,
      /^business$/i,
      /^employer$/i
    ]
  };

  /**
   * Validate file type and basic security checks
   */
  async validateFileType(file: any): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      fileType: file.mimetype,
      fileSize: file.size,
      errors: [],
      warnings: []
    };

    try {
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        result.errors.push(`File size ${file.size} bytes exceeds maximum allowed size of ${this.MAX_FILE_SIZE} bytes`);
        result.isValid = false;
      }

      // Check MIME type
      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        result.errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
        result.isValid = false;
      }

      // Verify actual file type matches MIME type
      if (file.buffer) {
        const detectedType = await fileTypeFromBuffer(file.buffer);
        if (detectedType && !this.isCompatibleFileType(file.mimetype, detectedType.mime)) {
          result.warnings.push(`Detected file type ${detectedType.mime} differs from declared type ${file.mimetype}`);
        }
      }

      // Check file extension
      const extension = path.extname(file.originalname).toLowerCase();
      if (!['.csv', '.txt', '.xls', '.xlsx'].includes(extension)) {
        result.warnings.push(`File extension ${extension} may not be compatible`);
      }

      this.logger.log(`File validation completed for ${file.originalname}: ${result.isValid ? 'VALID' : 'INVALID'}`);

    } catch (error) {
      this.logger.error(`Error validating file ${file.originalname}:`, error);
      result.errors.push(`File validation failed: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Enhanced malware scanning using advanced security service
   */
  async scanForMalware(filePath: string): Promise<boolean> {
    try {
      const scanResult = await this.enhancedSecurityService.performAdvancedMalwareScan(filePath);

      if (!scanResult.isClean) {
        this.logger.warn(`Malware detected in ${filePath}: ${scanResult.threats.join(', ')}`);
      }

      return scanResult.isClean;
    } catch (error) {
      this.logger.error(`Error scanning file for malware: ${error.message}`);
      return false;
    }
  }

  /**
   * Perform comprehensive security validation and storage
   */
  async secureFileProcessing(filePath: string, jobId: string): Promise<FileSecurityReport> {
    try {
      return await this.enhancedSecurityService.secureFileStorage(filePath, jobId);
    } catch (error) {
      this.logger.error(`Secure file processing failed for ${filePath}:`, error);
      throw new BadRequestException(`File security processing failed: ${error.message}`);
    }
  }

  /**
   * Parse CSV file with comprehensive error handling
   * Supports local paths and S3 URLs
   */
  async parseCsvFile(filePathOrUrl: string, tenantId: string): Promise<CsvParseResult> {
    const result: CsvParseResult = {
      headers: [],
      data: [],
      totalRows: 0,
      errors: []
    };

    let localFilePath = filePathOrUrl;
    let isTempFile = false;

    try {
      // Check if it's an S3 URL
      if (filePathOrUrl.startsWith('http')) {
        this.logger.log(`Downloading CSV from S3: ${filePathOrUrl}`);
        const url = new URL(filePathOrUrl);
        // Assuming path structure /bucket/key
        const pathParts = url.pathname.split('/');
        if (pathParts.length >= 3) {
          const key = pathParts.slice(2).join('/');
          const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp', 'csv-download-'));
          localFilePath = path.join(tempDir, `download-${Date.now()}.csv`);
          await this.s3Service.downloadFile(key, tenantId, localFilePath);
          isTempFile = true;
          this.logger.log(`Downloaded to temporary file: ${localFilePath}`);
        } else {
          throw new Error('Invalid S3 URL format');
        }
      }

      const fileContent = await fs.readFile(localFilePath, 'utf8');

      const parsePromise = new Promise<CsvParseResult>((resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          transform: (value: string) => value.trim(),
          complete: (results) => {
            result.headers = results.meta.fields || [];
            result.data = results.data;
            result.totalRows = results.data.length;

            // Convert Papa Parse errors to our format
            if (results.errors && results.errors.length > 0) {
              result.errors = results.errors.map(error => ({
                row: error.row || 0,
                message: error.message,
                code: error.code || 'PARSE_ERROR'
              }));
            }

            this.logger.log(`CSV parsing completed: ${result.totalRows} rows, ${result.headers.length} columns, ${result.errors.length} errors`);
            resolve(result);
          },
          error: (error) => {
            this.logger.error(`CSV parsing failed: ${error.message}`);
            reject(new BadRequestException(`Failed to parse CSV file: ${error.message}`));
          }
        });
      });

      return await parsePromise;

    } catch (error) {
      this.logger.error(`Error reading/parsing CSV file: ${error.message}`);
      throw new BadRequestException(`Failed to read/parse CSV file: ${error.message}`);
    } finally {
      // Clean up temp file if we downloaded it
      if (isTempFile && localFilePath) {
        try {
          await fs.unlink(localFilePath);
          await fs.rmdir(path.dirname(localFilePath)); // Remove temp dir
          this.logger.log(`Cleaned up temp download file: ${localFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to cleanup temp download file: ${localFilePath}`, cleanupError);
        }
      }
    }
  }

  /**
   * Detect column types and suggest field mappings
   */
  async detectColumns(csvData: any[]): Promise<ColumnDetectionResult> {
    if (!csvData || csvData.length === 0) {
      return {
        detectedColumns: [],
        suggestions: [],
        confidence: 0
      };
    }

    const headers = Object.keys(csvData[0]);
    const detectedColumns: DetectedColumn[] = [];
    const suggestions: ColumnSuggestion[] = [];

    // Analyze each column
    for (const header of headers) {
      const column = await this.analyzeColumn(header, csvData);
      detectedColumns.push(column);

      // Generate field mapping suggestions
      const suggestion = this.suggestFieldMapping(header, column);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Calculate overall confidence based on successful mappings
    const successfulMappings = suggestions.filter(s => s.confidence > 0.7).length;
    const confidence = headers.length > 0 ? successfulMappings / headers.length : 0;

    return {
      detectedColumns,
      suggestions,
      confidence
    };
  }

  /**
   * Validate column mapping configuration with custom fields support
   */
  async validateColumnMapping(mapping: Record<string, string>): Promise<boolean> {
    const requiredFields = ['email'];

    // Get available fields including custom fields
    const availableFields = await this.customFieldService.getFieldsForMapping();
    const validFieldKeys = availableFields.map(field => field.key);

    // Check if required fields are mapped
    for (const field of requiredFields) {
      const isMapped = Object.values(mapping).includes(field);
      if (!isMapped) {
        this.logger.warn(`Required field '${field}' is not mapped`);
        return false;
      }
    }

    // Check if mapped fields are valid
    for (const [csvColumn, field] of Object.entries(mapping)) {
      if (!validFieldKeys.includes(field)) {
        this.logger.warn(`Invalid field mapping: '${field}' is not a valid field`);
        return false;
      }
    }

    return true;
  }

  /**
   * Process subscriber data with custom fields
   */
  async processSubscriberData(
    csvData: any[],
    columnMapping: Record<string, string>
  ): Promise<{
    processedData: any[];
    errors: string[];
  }> {
    const processedData: any[] = [];
    const errors: string[] = [];

    // Get custom fields for validation
    const customFields = await this.customFieldService.findAll(true);

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const subscriberData: any = {
        customFields: {}
      };

      try {
        // Process each mapped column
        for (const [csvColumn, fieldKey] of Object.entries(columnMapping)) {
          const value = row[csvColumn];

          if (fieldKey.startsWith('custom_')) {
            // Handle custom field
            const customFieldName = fieldKey.replace('custom_', '');
            const customField = customFields.find(f => f.name === customFieldName);

            if (customField) {
              const validation = await this.customFieldService.validateCustomFieldValue(customField, value);
              if (!validation.isValid) {
                errors.push(`Row ${i + 1}, ${customField.label}: ${validation.error}`);
                continue;
              }
              subscriberData.customFields[customFieldName] = value;
            }
          } else {
            // Handle standard field
            subscriberData[fieldKey] = value;
          }
        }

        processedData.push(subscriberData);

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return { processedData, errors };
  }

  /**
   * Enhanced cleanup of temporary files with security considerations
   */
  async cleanupTempFiles(jobId: string): Promise<void> {
    try {
      // Use enhanced security service for secure cleanup
      const cleanupResult = await this.enhancedSecurityService.automaticSensitiveFileCleanup(jobId);

      this.logger.log(`Secure cleanup completed for job ${jobId}: ${cleanupResult.cleanedFiles} files, ${cleanupResult.totalSize} bytes`);

      if (cleanupResult.errors.length > 0) {
        this.logger.warn(`Cleanup errors for job ${jobId}: ${cleanupResult.errors.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up temporary files for job ${jobId}:`, error);
    }
  }

  /**
   * Verify file integrity before processing
   */
  async verifyFileIntegrity(filePath: string, jobId: string): Promise<boolean> {
    try {
      return await this.enhancedSecurityService.verifyFileIntegrity(filePath, jobId);
    } catch (error) {
      this.logger.error(`File integrity verification failed for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Generate secure file path for uploaded files
   */
  generateSecureFilePath(originalFileName: string, jobId: string): string {
    const sanitizedName = this.sanitizeFileName(originalFileName);
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${jobId}-${timestamp}`).digest('hex').substring(0, 8);

    return path.join('temp', 'imports', jobId, `${timestamp}-${hash}-${sanitizedName}`);
  }

  /**
   * Sanitize file name to prevent path traversal attacks
   */
  private sanitizeFileName(fileName: string): string {
    // Remove path separators and dangerous characters
    return fileName
      .replace(/[\/\\:*?"<>|]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^\.+/, '')
      .substring(0, 100); // Limit length
  }

  /**
   * Check if detected file type is compatible with declared MIME type
   */
  private isCompatibleFileType(declaredType: string, detectedType: string): boolean {
    const compatibilityMap: Record<string, string[]> = {
      'text/csv': ['text/plain'],
      'application/csv': ['text/plain', 'text/csv'],
      'text/plain': ['text/csv', 'application/csv']
    };

    return declaredType === detectedType ||
      (compatibilityMap[declaredType] && compatibilityMap[declaredType].includes(detectedType));
  }

  /**
   * Analyze individual column to determine type and characteristics
   */
  private async analyzeColumn(header: string, data: any[]): Promise<DetectedColumn> {
    const values = data.map(row => row[header]).filter(val => val != null && val !== '');
    const samples = values.slice(0, 5);
    const nullCount = data.length - values.length;
    const uniqueCount = new Set(values).size;

    // Determine column type
    let type: DetectedColumn['type'] = 'unknown';

    if (this.isEmailColumn(values)) {
      type = 'email';
    } else if (this.isNumberColumn(values)) {
      type = 'number';
    } else if (this.isDateColumn(values)) {
      type = 'date';
    } else {
      type = 'text';
    }

    return {
      name: header,
      type,
      samples,
      nullCount,
      uniqueCount
    };
  }

  /**
   * Check if column contains email addresses
   */
  private isEmailColumn(values: string[]): boolean {
    if (values.length === 0) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailCount = values.filter(val => emailRegex.test(val)).length;

    return emailCount / values.length > 0.8; // 80% of values should be valid emails
  }

  /**
   * Check if column contains numbers
   */
  private isNumberColumn(values: string[]): boolean {
    if (values.length === 0) return false;

    const numberCount = values.filter(val => !isNaN(Number(val))).length;
    return numberCount / values.length > 0.8;
  }

  /**
   * Check if column contains dates
   */
  private isDateColumn(values: string[]): boolean {
    if (values.length === 0) return false;

    const dateCount = values.filter(val => !isNaN(Date.parse(val))).length;
    return dateCount / values.length > 0.8;
  }

  /**
   * Suggest field mapping based on column name and content
   */
  private suggestFieldMapping(columnName: string, column: DetectedColumn): ColumnSuggestion | null {
    // Check against known patterns
    for (const [fieldName, patterns] of Object.entries(this.FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(columnName)) {
          return {
            csvColumn: columnName,
            suggestedField: fieldName,
            confidence: 0.9,
            reason: `Column name matches ${fieldName} pattern`
          };
        }
      }
    }

    // Check based on column type
    if (column.type === 'email') {
      return {
        csvColumn: columnName,
        suggestedField: 'email',
        confidence: 0.8,
        reason: 'Column contains email addresses'
      };
    }

    return null;
  }
}