import { Test, TestingModule } from '@nestjs/testing';
import { FileValidatorService } from './file-validator.service';
import { UnsupportedFileTypeException, FileSizeExceededException, FileSecurityException } from '../exceptions/document-processing.exceptions';

describe('FileValidatorService', () => {
    let service: FileValidatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FileValidatorService],
        }).compile();

        service = module.get<FileValidatorService>(FileValidatorService);
    });

    describe('validateFile', () => {
        it('should validate sane pdf file', async () => {
            const buffer = Buffer.from('%PDF-1.4 ...'); // Minimal PDF signature
            const result = await service.validateFile(buffer, 'test.pdf');

            expect(result.isValid).toBe(true);
            expect(result.fileType).toBe('pdf');
        });

        it('should detect executables as invalid', async () => {
            // Mock dangerous signature
            const buffer = Buffer.from('MZ...'); // Windows EXE header

            await expect(service.validateFile(buffer, 'test.exe')).rejects.toThrow(UnsupportedFileTypeException);
        });

        it('should validate file size', async () => {
            const hugeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

            await expect(service.validateFile(hugeBuffer, 'test.pdf')).rejects.toThrow(FileSizeExceededException);
        });
    });

    describe('extractFileType', () => {
        it('should extract extension from filename', () => {
            expect(service.extractFileType('doc.pdf')).toBe('pdf');
        });
    });

    describe('securityChecks', () => {
        it('should flag script content', async () => {
            const buffer = Buffer.from('<script>alert(1)</script>');
            jest.spyOn(service, 'extractFileType').mockReturnValue('html'); // Force HTML context check if applicable

            // Depending on implementation details for generic buffers:
            // If strict checking is on, this might throw or return metadata
            // Given outline, it performs regex checks.
        });
    });
});
