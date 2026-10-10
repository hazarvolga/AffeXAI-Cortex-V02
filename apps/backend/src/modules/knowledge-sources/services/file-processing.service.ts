import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';
const pdf = require('pdf-parse');

export interface ProcessedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    fileSize: number;
    mimeType: string;
  };
}

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  private readonly SUPPORTED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
  };

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Process uploaded document and extract text
   */
  async processDocument(filePath: string, mimeType: string): Promise<ProcessedDocument> {
    this.logger.log(`Processing document: ${filePath}`);

    // Validate file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new BadRequestException('File not found');
    }

    // Get file stats
    const stats = await fs.stat(filePath);

    if (stats.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type
    if (!this.isSupported(mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }

    // Extract text based on file type
    let extractedText: string;
    let pageCount: number | undefined;

    const extension = path.extname(filePath).toLowerCase();

    try {
      if (extension === '.pdf') {
        const result = await this.extractFromPdf(filePath);
        extractedText = result.text;
        pageCount = result.pageCount;
      } else if (extension === '.docx') {
        extractedText = await this.extractFromDocx(filePath);
      } else if (extension === '.doc') {
        // For .doc files, we'll need additional library or conversion
        // For MVP, we can throw an error or handle basic extraction
        throw new BadRequestException('.doc format not yet supported, please use .docx');
      } else if (['.txt', '.md'].includes(extension)) {
        extractedText = await this.extractFromText(filePath);
      } else {
        throw new BadRequestException(`Unsupported file extension: ${extension}`);
      }
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }

    // Clean and normalize text
    const cleanedText = this.cleanText(extractedText);

    return {
      text: cleanedText,
      metadata: {
        pageCount,
        wordCount: this.countWords(cleanedText),
        characterCount: cleanedText.length,
        fileSize: stats.size,
        mimeType,
      },
    };
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPdf(filePath: string): Promise<{ text: string; pageCount: number }> {
    const dataBuffer = await fs.readFile(filePath);
    // Use v2 API
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: dataBuffer });

    try {
      const info = await parser.getInfo();
      const result = await parser.getText();
      return {
        text: result.text,
        pageCount: info.total || 0,
      };
    } finally {
      await parser.destroy();
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractFromDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract text from plain text files
   */
  private async extractFromText(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if file type is supported
   */
  isSupported(mimeType: string): boolean {
    return Object.keys(this.SUPPORTED_TYPES).includes(mimeType);
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Object.values(this.SUPPORTED_TYPES).flat();
  }

  /**
   * Validate file before processing
   */
  async validateFile(filePath: string, mimeType: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check file exists
      await fs.access(filePath);

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
      }

      // Check file type
      if (!this.isSupported(mimeType)) {
        return {
          valid: false,
          error: `Unsupported file type: ${mimeType}. Supported types: ${this.getSupportedExtensions().join(', ')}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}
