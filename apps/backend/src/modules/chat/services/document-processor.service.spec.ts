import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentProcessorService } from './document-processor.service';
import { ChatDocument } from '../entities/chat-document.entity';
import { FileValidatorService } from './file-validator.service';

describe('DocumentProcessorService', () => {
    let service: DocumentProcessorService;
    let documentRepository: Repository<ChatDocument>;
    let fileValidator: FileValidatorService;

    const mockDocumentRepository = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(doc => Promise.resolve({ id: 'doc-1', ...doc })),
        findOne: jest.fn(),
    };

    const mockFileValidator = {
        validateFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentProcessorService,
                { provide: getRepositoryToken(ChatDocument), useValue: mockDocumentRepository },
                { provide: FileValidatorService, useValue: mockFileValidator },
            ],
        }).compile();

        service = module.get<DocumentProcessorService>(DocumentProcessorService);
        documentRepository = module.get(getRepositoryToken(ChatDocument));
        fileValidator = module.get(FileValidatorService);

        jest.clearAllMocks();
    });

    describe('processDocument', () => {
        it('should process text file', async () => {
            const buffer = Buffer.from('Hello World');
            mockFileValidator.validateFile.mockResolvedValue({
                isValid: true, fileType: 'txt', mimeType: 'text/plain'
            });

            const result = await service.processDocument(buffer, 'test.txt', 'session-1');

            expect(result.extractedContent).toBe('Hello World');
            expect(mockDocumentRepository.save).toHaveBeenCalled();
        });

        it('should handle PDF extraction (mocked)', async () => {
            const buffer = Buffer.from('%PDF...');
            mockFileValidator.validateFile.mockResolvedValue({
                isValid: true, fileType: 'pdf', mimeType: 'application/pdf'
            });
            // Mock internal extractFromPdf if possible, or assume simple logic for buffer in test env
            // Usually requires mocking pdf-parse lib, but here we can spy on private method if we cast to any or just trust it handles it (but better to mock dependent lib or spy)

            jest.spyOn(service, 'extractFromPdf').mockResolvedValue('PDF Content');

            const result = await service.processDocument(buffer, 'test.pdf', 'session-1');
            expect(result.extractedContent).toBe('PDF Content');
        });
    });

    describe('detectAndDecodeText', () => {
        it('should decode utf-8 buffer', () => {
            const buffer = Buffer.from('Hello', 'utf-8');
            const text = service.detectAndDecodeText(buffer);
            expect(text).toBe('Hello');
        });
    });
});
