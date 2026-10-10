import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulkCertificateService } from './bulk-certificate.service';
import { Certificate, CertificateStatus } from './entities/certificate.entity';

describe('BulkCertificateService', () => {
    let service: BulkCertificateService;
    let repo: Repository<Certificate>;

    const mockRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve(Array.isArray(d) ? d.map((x, i) => ({ id: `c-${i}`, ...x })) : { id: 'c-1', ...d })),
        count: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BulkCertificateService,
                { provide: getRepositoryToken(Certificate), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<BulkCertificateService>(BulkCertificateService);
        repo = module.get(getRepositoryToken(Certificate));
        jest.clearAllMocks();
    });

    describe('generateForEvent', () => {
        it('should generate multiple certificates', async () => {
            const config = { templateId: 't1', logoMediaId: null, description: null, validityDays: 365 };
            const participants = [
                { recipientName: 'Alice', recipientEmail: 'alice@test.com' },
                { recipientName: 'Bob', recipientEmail: 'bob@test.com' }
            ];

            const result = await service.generateForEvent('e1', 'Event A', config, participants);

            expect(result.length).toBe(2);
            expect(repo.create).toHaveBeenCalled();
            expect(repo.save).toHaveBeenCalled();
            expect(result[0].status).toBe(CertificateStatus.ISSUED);
        });

        it('should throw if templateId missing', async () => {
            await expect(service.generateForEvent('e1', 'A', { templateId: null } as any, [])).
                rejects.toThrow('Certificate template is required');
        });
    });

    describe('generateSingle', () => {
        it('should generate one certificate', async () => {
            const config = { templateId: 't1', logoMediaId: null, description: null, validityDays: null };
            const participant = { recipientName: 'Alice', recipientEmail: 'alice@test.com' };

            const result = await service.generateSingle('e1', 'A', config, participant);

            expect(result.recipientName).toBe('Alice');
        });
    });

    describe('certificateExists', () => {
        it('should return true if count > 0', async () => {
            mockRepo.count.mockResolvedValue(1);
            const exists = await service.certificateExists('e1', 'email');
            expect(exists).toBe(true);
        });
    });

    describe('getEventCertificateStats', () => {
        it('should calculate stats', async () => {
            mockRepo.find.mockResolvedValue([
                { status: CertificateStatus.ISSUED },
                { status: CertificateStatus.SENT },
                { status: CertificateStatus.DRAFT }
            ]);

            const stats = await service.getEventCertificateStats('e1');

            expect(stats.total).toBe(3);
            expect(stats.issued).toBe(1);
            expect(stats.sent).toBe(1);
        });
    });
});
