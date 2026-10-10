import { Test, TestingModule } from '@nestjs/testing';
import { PdfGeneratorService } from './pdf-generator.service';
import { Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('puppeteer');
jest.mock('fs/promises');

describe('PdfGeneratorService', () => {
    let service: PdfGeneratorService;

    const mockPage = {
        setContent: jest.fn(),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-content')),
    };

    const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
    };

    beforeEach(async () => {
        (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
        (fs.unlink as jest.Mock).mockResolvedValue(undefined);
        (fs.access as jest.Mock).mockResolvedValue(undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [PdfGeneratorService],
        }).compile();

        service = module.get<PdfGeneratorService>(PdfGeneratorService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateCertificatePdf', () => {
        it('should generate PDF successfully', async () => {
            const template = {
                htmlContent: '<html>{{recipientName}}</html>',
                pageFormat: 'A4',
                orientation: 'landscape'
            };

            const data = {
                recipientName: 'John Doe',
                issuedAt: new Date().toISOString()
            };

            const result = await service.generateCertificatePdf(template as any, data as any, 'cert-1');

            expect(puppeteer.launch).toHaveBeenCalled();
            expect(mockPage.setContent).toHaveBeenCalled();
            expect(mockPage.pdf).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
            expect(result).toContain('/uploads/certificates/');
        });

        it('should handle generation errors', async () => {
            (puppeteer.launch as jest.Mock).mockRejectedValue(new Error('Browser failed'));

            await expect(service.generateCertificatePdf({} as any, {} as any, '1'))
                .rejects.toThrow('PDF generation failed');
        });
    });

    describe('deletePdf', () => {
        it('should delete file if exists', async () => {
            await service.deletePdf('/path/to/file.pdf');
            expect(fs.unlink).toHaveBeenCalled();
        });
    });

    describe('pdfExists', () => {
        it('should return true if file accessible', async () => {
            const result = await service.pdfExists('/path/to.pdf');
            expect(result).toBe(true);
        });

        it('should return false if error', async () => {
            (fs.access as jest.Mock).mockRejectedValue(new Error('No file'));
            const result = await service.pdfExists('/path/to.pdf');
            expect(result).toBe(false);
        });
    });
});
