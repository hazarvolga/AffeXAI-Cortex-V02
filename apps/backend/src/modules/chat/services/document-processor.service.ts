import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import { Workbook } from 'exceljs';
import { ChatDocument, DocumentProcessingStatus } from '../entities/chat-document.entity';
import { FileValidatorService } from './file-validator.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import {
  DocumentProcessingException,
  TextExtractionException,
  InvalidFileException
} from '../exceptions/document-processing.exceptions';

export interface ProcessedDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  extractedContent: string;
  metadata: Record<string, any>;
  processingStatus: DocumentProcessingStatus;
}

export interface DocumentMetadata {
  mimeType?: string;
  pageCount?: number;
  wordCount?: number;
  lineCount?: number;
  characterCount?: number;
  characterCountNoSpaces?: number;
  readingTimeMinutes?: number;
  extractionMethod?: string;
  processingError?: string;
  checksum?: string;
  contentChecksum?: string;
  language?: string;
  hasImages?: boolean;
  hasTables?: boolean;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private readonly uploadDir = process.env.UPLOAD_DIR || 'uploads/chat-documents';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  // Supported file formats
  readonly supportedFormats = ['pdf', 'docx', 'xlsx', 'txt', 'md'];

  // MIME type mappings
  private readonly mimeTypes = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'md': 'text/markdown'
  };

  constructor(
    @InjectRepository(ChatDocument)
    private readonly documentRepository: Repository<ChatDocument>,
    private readonly fileValidator: FileValidatorService,
    private readonly tenantService: TenantService,
  ) {
    this.ensureUploadDirectory();
  }

  /**
   * Process uploaded document and extract text content
   */
  async processDocument(
    file: Buffer,
    filename: string,
    sessionId: string,
    messageId?: string,
    declaredMimeType?: string
  ): Promise<ProcessedDocument> {
    this.logger.log(`Processing document: ${filename} for session: ${sessionId}`);

    try {
      // Comprehensive file validation
      const validationResult = await this.fileValidator.validateFile(file, filename, declaredMimeType);

      const storagePath = await this.saveFile(file, filename, sessionId, validationResult.checksum);

      // Create document record with validation results
      const document = this.documentRepository.create({
        sessionId,
        messageId,
        filename,
        fileType: validationResult.fileType,
        fileSize: file.length,
        storagePath,
        processingStatus: DocumentProcessingStatus.PROCESSING,
        metadata: {
          mimeType: validationResult.mimeType,
          checksum: validationResult.checksum,
          extractionMethod: this.getExtractionMethod(validationResult.fileType),
          validationTimestamp: new Date().toISOString(),
          // Store security checks as part of metadata
          ...validationResult.securityChecks
        },
        tenantId: this.tenantService.getTenantId()
      });

      const savedDocument = await this.documentRepository.save(document);

      // Process document asynchronously
      this.processDocumentAsync(savedDocument.id, file, validationResult.fileType);

      return {
        id: savedDocument.id,
        filename: savedDocument.filename,
        fileType: savedDocument.fileType,
        fileSize: savedDocument.fileSize,
        extractedContent: '',
        metadata: savedDocument.metadata,
        processingStatus: savedDocument.processingStatus
      };
    } catch (error) {
      this.logger.error(`Document processing failed for ${filename}:`, error);

      // If it's a validation error, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Otherwise, wrap in DocumentProcessingException
      throw new DocumentProcessingException(`Failed to process document: ${filename}`, error);
    }
  }

  /**
   * Extract text content from different file formats
   */
  async extractText(file: Buffer, fileType: string): Promise<string> {
    this.logger.log(`Extracting text from ${fileType} file`);

    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractFromPdf(file);
        case 'docx':
          return await this.extractFromDocx(file);
        case 'xlsx':
          return await this.extractFromXlsx(file);
        case 'txt':
          return await this.extractFromTxt(file);
        case 'md':
          return await this.extractFromMarkdown(file);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      this.logger.error(`Text extraction failed for ${fileType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate metadata for processed document
   */
  generateMetadata(content: string, filename: string, fileType: string): DocumentMetadata {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const lines = content.split('\n').length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;

    // Estimate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words.length / 200);

    return {
      mimeType: this.mimeTypes[fileType],
      wordCount: words.length,
      lineCount: lines,
      characterCount: characters,
      characterCountNoSpaces: charactersNoSpaces,
      readingTimeMinutes,
      extractionMethod: this.getExtractionMethod(fileType),
      contentChecksum: this.generateChecksum(Buffer.from(content, 'utf-8')),
      language: this.detectLanguage(content),
      hasImages: this.detectImages(content, fileType),
      hasTables: this.detectTables(content, fileType)
    };
  }

  /**
   * Get document processing status
   */
  async getProcessingStatus(documentId: string): Promise<ChatDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenantId: this.tenantService.getTenantId() }
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    return document;
  }

  /**
   * Get all documents for a session
   */
  async getSessionDocuments(sessionId: string): Promise<ChatDocument[]> {
    return this.documentRepository.find({
      where: { sessionId, tenantId: this.tenantService.getTenantId() },
      order: { createdAt: 'DESC' }
    });
  }

  // Private methods

  private async processDocumentAsync(documentId: string, file: Buffer, fileType: string): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting async processing for document ID: ${documentId}`);

      // Extract text content
      const extractedContent = await this.extractText(file, fileType);

      if (!extractedContent || extractedContent.trim().length === 0) {
        throw new TextExtractionException(fileType, new Error('No text content extracted'));
      }

      // Generate comprehensive metadata
      const metadata = this.generateMetadata(extractedContent, '', fileType);
      const processingTime = Date.now() - startTime;

      // Get current metadata and merge with new data
      const currentDocument = await this.documentRepository.findOne({
        where: { id: documentId, tenantId: this.tenantService.getTenantId() }
      });

      const updatedMetadata = {
        ...currentDocument?.metadata,
        ...metadata,
        processingTimeMs: processingTime,
        processingCompletedAt: new Date().toISOString(),
        extractionSuccess: true
      };

      await this.documentRepository.update(documentId, {
        extractedContent,
        processingStatus: DocumentProcessingStatus.COMPLETED,
        metadata: updatedMetadata as any,
        processedAt: new Date()
      });

      this.logger.log(`Document processing completed for ID: ${documentId} in ${processingTime}ms`);

      // Emit processing completion via WebSocket if available
      await this.notifyProcessingComplete(documentId, currentDocument?.sessionId);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Document processing failed for ID: ${documentId} after ${processingTime}ms:`, error);

      // Get current metadata to preserve validation results
      const currentDocument = await this.documentRepository.findOne({
        where: { id: documentId, tenantId: this.tenantService.getTenantId() }
      });

      const errorMetadata = {
        ...currentDocument?.metadata,
        processingError: error.message,
        processingTimeMs: processingTime,
        processingFailedAt: new Date().toISOString(),
        extractionSuccess: false,
        errorType: error.constructor.name
      };

      await this.documentRepository.update(documentId, {
        processingStatus: DocumentProcessingStatus.FAILED,
        metadata: errorMetadata as any,
        processedAt: new Date()
      });

      // Emit processing failure via WebSocket if available
      await this.notifyProcessingFailed(documentId, currentDocument?.sessionId, error.message);
    }
  }

  /**
   * Notify processing completion via WebSocket
   */
  private async notifyProcessingComplete(documentId: string, sessionId?: string): Promise<void> {
    if (!sessionId) return;

    try {
      // This would be injected in a real implementation
      // For now, we'll emit via a global event or service
      this.logger.log(`Document processing completed notification for session: ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to send processing completion notification:', error);
    }
  }

  /**
   * Notify processing failure via WebSocket
   */
  private async notifyProcessingFailed(documentId: string, sessionId?: string, errorMessage?: string): Promise<void> {
    if (!sessionId) return;

    try {
      // This would be injected in a real implementation
      // For now, we'll emit via a global event or service
      this.logger.log(`Document processing failed notification for session: ${sessionId}, error: ${errorMessage}`);
    } catch (error) {
      this.logger.error('Failed to send processing failure notification:', error);
    }
  }

  private getFileExtension(filename: string): string {
    return extname(filename).toLowerCase().substring(1);
  }

  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async saveFile(file: Buffer, filename: string, sessionId: string, checksum: string): Promise<string> {
    const sessionDir = join(this.uploadDir, sessionId);
    await this.ensureDirectory(sessionDir);

    const fileExtension = extname(filename);
    const baseName = basename(filename, fileExtension);
    const safeFilename = `${baseName}-${checksum.substring(0, 8)}${fileExtension}`;
    const filePath = join(sessionDir, safeFilename);

    await fs.writeFile(filePath, file);
    return filePath;
  }

  private async ensureUploadDirectory(): Promise<void> {
    await this.ensureDirectory(this.uploadDir);
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private getExtractionMethod(fileType: string): string {
    const methods = {
      'pdf': 'pdf-parse',
      'docx': 'mammoth',
      'xlsx': 'xlsx',
      'txt': 'utf-8-decode',
      'md': 'utf-8-decode'
    };
    return methods[fileType] || 'unknown';
  }

  // Text extraction methods

  private async extractFromPdf(file: Buffer): Promise<string> {
    try {
      const data = await pdfParse(file, {
        // PDF parsing options
        max: 0, // No page limit
        version: 'v1.10.100' // Use specific version for consistency
      });

      if (!data.text || data.text.trim().length === 0) {
        throw new TextExtractionException('pdf', new Error('No text content found in PDF'));
      }

      return data.text.trim();
    } catch (error) {
      this.logger.error(`PDF extraction failed: ${error.message}`);
      if (error instanceof TextExtractionException) {
        throw error;
      }
      throw new TextExtractionException('pdf', error);
    }
  }

  private async extractFromDocx(file: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({
        buffer: file
      });

      if (result.messages && result.messages.length > 0) {
        this.logger.warn('DOCX extraction warnings:', result.messages);
      }

      if (!result.value || result.value.trim().length === 0) {
        throw new TextExtractionException('docx', new Error('No text content found in DOCX'));
      }

      return result.value.trim();
    } catch (error) {
      this.logger.error(`DOCX extraction failed: ${error.message}`);
      if (error instanceof TextExtractionException) {
        throw error;
      }
      throw new TextExtractionException('docx', error);
    }
  }

  private async extractFromXlsx(file: Buffer): Promise<string> {
    try {
      const workbook = new Workbook();
      await workbook.xlsx.load(file as any);

      if (workbook.worksheets.length === 0) {
        throw new TextExtractionException('xlsx', new Error('No sheets found in XLSX file'));
      }

      let content = '';
      let totalCells = 0;

      workbook.eachSheet((worksheet) => {
        const rows: string[] = [];
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const cells: string[] = [];
          row.eachCell({ includeEmpty: true }, (cell) => {
            cells.push(cell.text);
            if (cell.text.trim()) totalCells += 1;
          });
          rows.push(cells.join(','));
        });
        const sheetData = rows.join('\n');

        if (sheetData.trim()) {
          content += `=== Sheet: ${worksheet.name} ===\n${sheetData}\n\n`;
        }
      });

      if (totalCells === 0) {
        throw new TextExtractionException('xlsx', new Error('No data found in XLSX file'));
      }

      return content.trim();
    } catch (error) {
      this.logger.error(`XLSX extraction failed: ${error.message}`);
      if (error instanceof TextExtractionException) {
        throw error;
      }
      throw new TextExtractionException('xlsx', error);
    }
  }

  private async extractFromTxt(file: Buffer): Promise<string> {
    try {
      // Try to detect encoding
      const content = this.detectAndDecodeText(file);

      if (!content || content.trim().length === 0) {
        throw new TextExtractionException('txt', new Error('No text content found in file'));
      }

      return content.trim();
    } catch (error) {
      this.logger.error(`TXT extraction failed: ${error.message}`);
      if (error instanceof TextExtractionException) {
        throw error;
      }
      throw new TextExtractionException('txt', error);
    }
  }

  private async extractFromMarkdown(file: Buffer): Promise<string> {
    try {
      const content = this.detectAndDecodeText(file);

      if (!content || content.trim().length === 0) {
        throw new TextExtractionException('md', new Error('No text content found in markdown file'));
      }

      return content.trim();
    } catch (error) {
      this.logger.error(`Markdown extraction failed: ${error.message}`);
      if (error instanceof TextExtractionException) {
        throw error;
      }
      throw new TextExtractionException('md', error);
    }
  }

  /**
   * Detect encoding and decode text content
   */
  private detectAndDecodeText(buffer: Buffer): string {
    // Try UTF-8 first (most common)
    try {
      const utf8Content = buffer.toString('utf-8');
      // Check if it contains replacement characters (indicates invalid UTF-8)
      if (!utf8Content.includes('\uFFFD')) {
        return utf8Content;
      }
    } catch (error) {
      this.logger.debug('UTF-8 decoding failed, trying other encodings');
    }

    // Try UTF-16 (with BOM detection)
    if (buffer.length >= 2) {
      const bom = buffer.readUInt16LE(0);
      if (bom === 0xFEFF || bom === 0xFFFE) {
        try {
          return buffer.toString('utf16le');
        } catch (error) {
          this.logger.debug('UTF-16 decoding failed');
        }
      }
    }

    // Try Latin1 (ISO-8859-1) as fallback
    try {
      return buffer.toString('latin1');
    } catch (error) {
      this.logger.debug('Latin1 decoding failed');
    }

    // Final fallback to ASCII
    try {
      return buffer.toString('ascii');
    } catch (error) {
      throw new Error('Unable to decode text content with any supported encoding');
    }
  }

  /**
   * Simple language detection based on common words
   */
  private detectLanguage(content: string): string {
    const text = content.toLowerCase();

    // Turkish indicators
    const turkishWords = ['ve', 'bir', 'bu', 'için', 'ile', 'olan', 'olarak', 'çok', 'daha', 'şu'];
    const turkishChars = /[çğıöşü]/g;

    // English indicators
    const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had'];

    // German indicators
    const germanWords = ['und', 'der', 'die', 'das', 'ist', 'mit', 'für', 'auf', 'von', 'zu'];
    const germanChars = /[äöüß]/g;

    let turkishScore = 0;
    let englishScore = 0;
    let germanScore = 0;

    // Check for specific characters
    const turkishCharMatches = text.match(turkishChars);
    if (turkishCharMatches) turkishScore += turkishCharMatches.length * 2;

    const germanCharMatches = text.match(germanChars);
    if (germanCharMatches) germanScore += germanCharMatches.length * 2;

    // Check for common words
    turkishWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) turkishScore += matches.length;
    });

    englishWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) englishScore += matches.length;
    });

    germanWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) germanScore += matches.length;
    });

    // Determine language
    if (turkishScore > englishScore && turkishScore > germanScore) {
      return 'tr';
    } else if (germanScore > englishScore && germanScore > turkishScore) {
      return 'de';
    } else if (englishScore > 0) {
      return 'en';
    }

    return 'unknown';
  }

  /**
   * Detect if content contains images (based on file type and content)
   */
  private detectImages(content: string, fileType: string): boolean {
    if (fileType === 'pdf') {
      // PDF might contain images, but we can't detect from text content
      return false; // Conservative approach
    }

    if (fileType === 'docx') {
      // Mammoth might include image references
      return content.includes('[image]') || content.includes('image');
    }

    if (fileType === 'md') {
      // Markdown image syntax
      return /!\[.*?\]\(.*?\)/.test(content);
    }

    return false;
  }

  /**
   * Detect if content contains tables
   */
  private detectTables(content: string, fileType: string): boolean {
    if (fileType === 'xlsx') {
      return true; // XLSX is inherently tabular
    }

    if (fileType === 'md') {
      // Markdown table syntax
      return /\|.*\|/.test(content);
    }

    // Look for CSV-like patterns
    const lines = content.split('\n');
    let tableLines = 0;

    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      if (line.includes(',') || line.includes('\t') || line.includes('|')) {
        const separators = (line.match(/[,\t|]/g) || []).length;
        if (separators >= 2) {
          tableLines++;
        }
      }
    }

    return tableLines >= 3; // At least 3 lines with table-like structure
  }
}
