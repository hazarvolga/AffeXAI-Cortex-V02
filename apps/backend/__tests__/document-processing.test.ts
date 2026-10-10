import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentProcessorService } from '../src/modules/chat/services/document-processor.service';
import { FileValidatorService } from '../src/modules/chat/services/file-validator.service';
import { ChatDocument, DocumentProcessingStatus } from '../src/modules/chat/entities/chat-document.entity';

describe('DocumentProcessorService', () => {
  let service: DocumentProcessorService;
  let fileValidator: FileValidatorService;
  let repository: Repository<ChatDocument>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockFileValidator = {
    validateFile: jest.fn(),
    getSupportedFormats: jest.fn(() => ['pdf', 'docx', 'xlsx', 'txt', 'md']),
    getMaxFileSize: jest.fn(() => 10 * 1024 * 1024),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentProcessorService,
        {
          provide: FileValidatorService,
          useValue: mockFileValidator,
        },
        {
          provide: getRepositoryToken(ChatDocument),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentProcessorService>(DocumentProcessorService);
    fileValidator = module.get<FileValidatorService>(FileValidatorService);
    repository = module.get<Repository<ChatDocument>>(getRepositoryToken(ChatDocument));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processDocument', () => {
    it('should process a text file successfully', async () => {
      const testFile = Buffer.from('This is a test document content.');
      const filename = 'test.txt';
      const sessionId = 'test-session-id';

      const validationResult = {
        isValid: true,
        fileType: 'txt',
        mimeType: 'text/plain',
        checksum: 'test-checksum',
        securityChecks: {
          hasExecutableContent: false,
          hasScriptContent: false,
          hasSuspiciousPatterns: false,
          isPasswordProtected: false,
        },
      };

      const mockDocument = {
        id: 'test-doc-id',
        sessionId,
        filename,
        fileType: 'txt',
        fileSize: testFile.length,
        processingStatus: DocumentProcessingStatus.PROCESSING,
        metadata: {},
      };

      mockFileValidator.validateFile.mockResolvedValue(validationResult);
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.processDocument(testFile, filename, sessionId);

      expect(result).toEqual({
        id: mockDocument.id,
        filename: mockDocument.filename,
        fileType: mockDocument.fileType,
        fileSize: mockDocument.fileSize,
        extractedContent: '',
        metadata: mockDocument.metadata,
        processingStatus: mockDocument.processingStatus,
      });

      expect(mockFileValidator.validateFile).toHaveBeenCalledWith(testFile, filename, undefined);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const testFile = Buffer.from('test content');
      const filename = 'test.exe';
      const sessionId = 'test-session-id';

      const validationError = new Error('Unsupported file type');
      mockFileValidator.validateFile.mockRejectedValue(validationError);

      await expect(service.processDocument(testFile, filename, sessionId)).rejects.toThrow();
    });
  });

  describe('extractText', () => {
    it('should extract text from a text file', async () => {
      const testContent = 'This is test content';
      const testFile = Buffer.from(testContent);

      const result = await service.extractText(testFile, 'txt');

      expect(result).toBe(testContent);
    });

    it('should extract text from markdown file', async () => {
      const testContent = '# Test Markdown\n\nThis is **bold** text.';
      const testFile = Buffer.from(testContent);

      const result = await service.extractText(testFile, 'md');

      expect(result).toBe(testContent);
    });

    it('should throw error for unsupported file type', async () => {
      const testFile = Buffer.from('test');

      await expect(service.extractText(testFile, 'unsupported')).rejects.toThrow();
    });
  });

  describe('generateMetadata', () => {
    it('should generate metadata for text content', () => {
      const content = 'This is a test document with multiple words and sentences.';
      const filename = 'test.txt';
      const fileType = 'txt';

      const metadata = service.generateMetadata(content, filename, fileType);

      expect(metadata).toHaveProperty('wordCount');
      expect(metadata).toHaveProperty('lineCount');
      expect(metadata).toHaveProperty('characterCount');
      expect(metadata).toHaveProperty('readingTimeMinutes');
      expect(metadata).toHaveProperty('language');
      expect(metadata.wordCount).toBeGreaterThan(0);
    });
  });

  describe('getSessionDocuments', () => {
    it('should return documents for a session', async () => {
      const sessionId = 'test-session-id';
      const mockDocuments = [
        { id: 'doc1', sessionId, filename: 'test1.txt' },
        { id: 'doc2', sessionId, filename: 'test2.txt' },
      ];

      mockRepository.find.mockResolvedValue(mockDocuments);

      const result = await service.getSessionDocuments(sessionId);

      expect(result).toEqual(mockDocuments);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { sessionId },
        order: { createdAt: 'DESC' },
      });
    });
  });
});

describe('FileValidatorService', () => {
  let service: FileValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileValidatorService],
    }).compile();

    service = module.get<FileValidatorService>(FileValidatorService);
  });

  describe('validateFile', () => {
    it('should validate a text file successfully', async () => {
      const testFile = Buffer.from('This is a test file');
      const filename = 'test.txt';

      const result = await service.validateFile(testFile, filename);

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.checksum).toBeDefined();
      expect(result.securityChecks).toBeDefined();
    });

    it('should reject files that are too large', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const filename = 'large.txt';

      await expect(service.validateFile(largeFile, filename)).rejects.toThrow('File size exceeds maximum limit');
    });

    it('should reject unsupported file types', async () => {
      const testFile = Buffer.from('test');
      const filename = 'test.exe';

      await expect(service.validateFile(testFile, filename)).rejects.toThrow('Unsupported file type');
    });

    it('should reject files with invalid filenames', async () => {
      const testFile = Buffer.from('test');
      const filename = '../../../etc/passwd';

      await expect(service.validateFile(testFile, filename)).rejects.toThrow('Filename contains invalid characters');
    });

    it('should reject empty files', async () => {
      const emptyFile = Buffer.alloc(0);
      const filename = 'empty.txt';

      await expect(service.validateFile(emptyFile, filename)).rejects.toThrow('File is empty');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return supported file formats', () => {
      const formats = service.getSupportedFormats();
      expect(formats).toContain('pdf');
      expect(formats).toContain('docx');
      expect(formats).toContain('xlsx');
      expect(formats).toContain('txt');
      expect(formats).toContain('md');
    });
  });

  describe('getMaxFileSize', () => {
    it('should return maximum file size', () => {
      const maxSize = service.getMaxFileSize();
      expect(maxSize).toBe(10 * 1024 * 1024); // 10MB
    });
  });
});