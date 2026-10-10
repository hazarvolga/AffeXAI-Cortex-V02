import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificatesService } from './certificates.service';
import { Certificate } from './entities/certificate.entity';
import { UsersService } from '../users/users.service';

describe('CertificatesService', () => {
    let service: CertificatesService;
    let repo: Repository<Certificate>;

    const mockRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: '1', ...d })),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn(),
        remove: jest.fn(),
    };

    const mockUsersService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CertificatesService,
                { provide: getRepositoryToken(Certificate), useValue: mockRepo },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        service = module.get<CertificatesService>(CertificatesService);
        repo = module.get(getRepositoryToken(Certificate));
    });

    describe('create', () => {
        it('should create certificate entity', async () => {
            // Legacy service might work with file. Let's mock file.
            const file = { filename: 'cert.pdf' };
            const dto = { title: 'Cert 1' };

            const result = await service.create(file as any, dto as any);
            expect(repo.save).toHaveBeenCalled();
        });
    });

    describe('applyDefaultDesign', () => {
        it('should modify doc object', () => {
            const doc = {
                image: jest.fn(),
                fontSize: jest.fn().mockReturnThis(),
                font: jest.fn().mockReturnThis(),
                text: jest.fn().mockReturnThis(),
                moveDown: jest.fn().mockReturnThis(),
            };
            const cert = {
                recipientName: 'Test',
                trainingTitle: 'Course',
                issuedAt: new Date()
            };

            service.applyDefaultDesign(doc, cert);

            expect(doc.text).toHaveBeenCalled();
        });
    });
});
