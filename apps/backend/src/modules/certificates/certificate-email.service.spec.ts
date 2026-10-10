import { Test, TestingModule } from '@nestjs/testing';
import { CertificateEmailService } from './certificate-email.service';
import { MailService } from '../mail/mail.service';
import * as fs from 'fs';

// Mock fs completely
jest.mock('fs');
jest.mock('path', () => ({
    join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

describe('CertificateEmailService', () => {
    let service: CertificateEmailService;
    let mailService: MailService;

    const mockMailService = {
        sendMail: jest.fn(),
        testConnection: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CertificateEmailService,
                { provide: MailService, useValue: mockMailService },
            ],
        }).compile();

        service = module.get<CertificateEmailService>(CertificateEmailService);
        mailService = module.get(MailService);
        jest.clearAllMocks();

        // Default mocks
        (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('pdf'));
    });

    describe('sendCertificateEmail', () => {
        it('should send email with attachment', async () => {
            const cert = {
                pdfUrl: '/uploads/cert.pdf',
                recipientEmail: 'test@test.com',
                recipientName: 'Test',
                trainingTitle: 'Training',
                certificateNumber: '123',
                issuedAt: new Date(),
            };

            mockMailService.sendMail.mockResolvedValue({ success: true, messageId: '1' });

            await service.sendCertificateEmail(cert as any);

            expect(fs.readFileSync).toHaveBeenCalled();
            expect(mailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: { email: 'test@test.com', name: 'Test' },
                attachments: expect.arrayContaining([expect.objectContaining({ contentType: 'application/pdf' })])
            }));
        });

        it('should throw if no pdf url', async () => {
            const cert = { recipientEmail: 'a@b.c' };
            await expect(service.sendCertificateEmail(cert as any)).rejects.toThrow('Certificate PDF not generated');
        });

        it('should throw if mail sending fails', async () => {
            const cert = { pdfUrl: 'url', recipientEmail: 'a@b.c', issuedAt: new Date() };
            mockMailService.sendMail.mockResolvedValue({ success: false });

            await expect(service.sendCertificateEmail(cert as any)).rejects.toThrow('Email sending failed');
        });
    });

    describe('testConnection', () => {
        it('should return true if connected', async () => {
            mockMailService.testConnection.mockResolvedValue(true);
            const result = await service.testConnection();
            expect(result).toBe(true);
        });
    });
});
