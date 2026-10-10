import { Test, TestingModule } from '@nestjs/testing';
import { GDPRComplianceService } from './gdpr-compliance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentRecord } from '../entities/consent-record.entity';
import { DataSubjectRequest } from '../entities/data-subject-request.entity';

describe('GDPRComplianceService', () => {
    let service: GDPRComplianceService;
    let consentRepository: Repository<ConsentRecord>;
    let requestRepository: Repository<DataSubjectRequest>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GDPRComplianceService,
                {
                    provide: getRepositoryToken(ConsentRecord),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(DataSubjectRequest),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<GDPRComplianceService>(GDPRComplianceService);
        consentRepository = module.get(getRepositoryToken(ConsentRecord));
        requestRepository = module.get(getRepositoryToken(DataSubjectRequest));

        jest.clearAllMocks();
    });

    describe('recordConsent', () => {
        it('should record user consent', async () => {
            const consent = {
                email: 'test@example.com',
                consentType: 'marketing',
                granted: true,
            };

            mockRepository.create.mockReturnValue(consent);
            mockRepository.save.mockResolvedValue(consent);

            const result = await service.recordConsent(consent);

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(consent);
        });

        it('should include IP address and user agent', async () => {
            const consent = {
                email: 'test@example.com',
                consentType: 'marketing',
                granted: true,
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };

            mockRepository.create.mockReturnValue(consent);
            mockRepository.save.mockResolvedValue(consent);

            await service.recordConsent(consent);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0',
                }),
            );
        });
    });

    describe('checkConsent', () => {
        it('should return true if consent granted', async () => {
            mockRepository.findOne.mockResolvedValue({
                email: 'test@example.com',
                granted: true,
            });

            const result = await service.checkConsent('test@example.com', 'marketing');

            expect(result).toBe(true);
        });

        it('should return false if consent not granted', async () => {
            mockRepository.findOne.mockResolvedValue({
                email: 'test@example.com',
                granted: false,
            });

            const result = await service.checkConsent('test@example.com', 'marketing');

            expect(result).toBe(false);
        });

        it('should return false if no consent record', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.checkConsent('test@example.com', 'marketing');

            expect(result).toBe(false);
        });
    });

    describe('createDataSubjectRequest', () => {
        it('should create data access request', async () => {
            const request = {
                email: 'test@example.com',
                requestType: 'access',
            };

            mockRepository.create.mockReturnValue(request);
            mockRepository.save.mockResolvedValue(request);

            const result = await service.createDataSubjectRequest(request);

            expect(mockRepository.create).toHaveBeenCalled();
            expect(result).toEqual(request);
        });

        it('should create data deletion request', async () => {
            const request = {
                email: 'test@example.com',
                requestType: 'deletion',
            };

            mockRepository.create.mockReturnValue(request);
            mockRepository.save.mockResolvedValue(request);

            const result = await service.createDataSubjectRequest(request);

            expect(result.requestType).toBe('deletion');
        });
    });

    describe('processDataDeletion', () => {
        it('should delete user data', async () => {
            mockRepository.find.mockResolvedValue([
                { id: '1', email: 'test@example.com' },
            ]);
            mockRepository.remove.mockResolvedValue({});

            await service.processDataDeletion('test@example.com');

            expect(mockRepository.remove).toHaveBeenCalled();
        });
    });

    describe('exportUserData', () => {
        it('should export all user data', async () => {
            const userData = {
                email: 'test@example.com',
                consents: [],
                subscriptions: [],
            };

            mockRepository.find.mockResolvedValue([]);

            const result = await service.exportUserData('test@example.com');

            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('consents');
        });
    });
});
