import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export class DocumentProcessingException extends InternalServerErrorException {
  constructor(message: string, cause?: Error) {
    super({
      message,
      error: 'Document Processing Failed',
      cause: cause?.message
    });
  }
}

export class UnsupportedFileTypeException extends BadRequestException {
  constructor(fileType: string, supportedTypes: string[]) {
    super({
      message: `Unsupported file type: ${fileType}`,
      error: 'Unsupported File Type',
      supportedTypes
    });
  }
}

export class FileSizeExceededException extends BadRequestException {
  constructor(fileSize: number, maxSize: number) {
    super({
      message: `File size ${Math.round(fileSize / (1024 * 1024) * 100) / 100}MB exceeds maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB`,
      error: 'File Size Exceeded',
      fileSize,
      maxSize
    });
  }
}

export class InvalidFileException extends BadRequestException {
  constructor(reason: string) {
    super({
      message: `Invalid file: ${reason}`,
      error: 'Invalid File',
      reason
    });
  }
}

export class TextExtractionException extends DocumentProcessingException {
  constructor(fileType: string, cause?: Error) {
    super(`Failed to extract text from ${fileType} file`, cause);
  }
}

export class FileSecurityException extends BadRequestException {
  constructor(reason: string) {
    super({
      message: `File security check failed: ${reason}`,
      error: 'File Security Check Failed',
      reason
    });
  }
}