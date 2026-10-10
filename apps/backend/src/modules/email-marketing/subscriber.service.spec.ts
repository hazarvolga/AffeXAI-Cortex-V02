import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SubscriberService } from '../subscriber.service';
import { Subscriber } from '../entities/subscriber.entity';
import { EmailValidationService } from '../services/email-validation.service';
import { AdvancedEmailValidationService } from '../services/advanced-email-validation.service';
import { CreateSubscriberDto } from '../dto/create-subscriber.dto';
import { UpdateSubscriberDto } from '../dto/update-subscriber.dto';

describe('SubscriberService', () => {
    let service: SubscriberService;
    let subscriberRepository: Repository<Subscriber>;
    let emailValidationService: EmailValidationService;
    let advancedEmailValidationService: AdvancedEmailValidationService;

    const mockSubscriber: Partial<Subscriber> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        status: 'active',
        mailerCheckResult: 'valid',
        groups: [],
        segments: [],
        subscribedAt: new Date(),
        lastUpdated: new Date(),
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockEmailValidationService = {
        validateEmail: jest.fn(),
    };

    const mockAdvancedEmailValidationService = {
        validateEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriberService,
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
                {
                    provide: EmailValidationService,
                    useValue: mockEmailValidationService,
                },
                {
                    provide: AdvancedEmailValidationService,
                    useValue: mockAdvancedEmailValidationService,
                },
            ],
        }).compile();

        service = module.get<SubscriberService>(SubscriberService);
        subscriberRepository = module.get<Repository<Subscriber>>(
            getRepositoryToken(Subscriber),
        );
        emailValidationService = module.get<EmailValidationService>(
            EmailValidationService,
        );
        advancedEmailValidationService = module.get<AdvancedEmailValidationService>(
            AdvancedEmailValidationService,
        );

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new subscriber with provided mailerCheckResult', async () => {
            const createDto: CreateSubscriberDto = {
                email: 'new@example.com',
                mailerCheckResult: 'valid',
                status: 'active',
            };

            mockRepository.create.mockReturnValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            const result = await service.create(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith({
                ...createDto,
                groups: [],
                segments: [],
            });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockAdvancedEmailValidationService.validateEmail).not.toHaveBeenCalled();
            expect(result).toEqual(mockSubscriber);
        });

        it('should validate email if mailerCheckResult not provided', async () => {
            const createDto: CreateSubscriberDto = {
                email: 'new@example.com',
            };

            const validationResult = { status: 'valid', score: 100 };
            mockAdvancedEmailValidationService.validateEmail.mockResolvedValue(validationResult);
            mockRepository.create.mockReturnValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            const result = await service.create(createDto, '192.168.1.1');

            expect(mockAdvancedEmailValidationService.validateEmail).toHaveBeenCalledWith(
                'new@example.com',
                '192.168.1.1',
            );
            expect(mockRepository.create).toHaveBeenCalledWith({
                ...createDto,
                mailerCheckResult: 'valid',
                status: 'pending',
                groups: [],
                segments: [],
            });
            expect(result).toEqual(mockSubscriber);
        });

        it('should set default status to pending if not provided', async () => {
            const createDto: CreateSubscriberDto = {
                email: 'new@example.com',
                mailerCheckResult: 'valid',
            };

            mockRepository.create.mockReturnValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            await service.create(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'pending',
                }),
            );
        });

        it('should initialize empty groups and segments if not provided', async () => {
            const createDto: CreateSubscriberDto = {
                email: 'new@example.com',
                mailerCheckResult: 'valid',
            };

            mockRepository.create.mockReturnValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            await service.create(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    groups: [],
                    segments: [],
                }),
            );
        });
    });

    describe('findAll', () => {
        it('should return all subscribers', async () => {
            const subscribers = [mockSubscriber];
            mockRepository.find.mockResolvedValue(subscribers);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual(subscribers);
        });

        it('should return empty array if no subscribers', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a subscriber by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);

            const result = await service.findOne(mockSubscriber.id);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockSubscriber.id },
            });
            expect(result).toEqual(mockSubscriber);
        });

        it('should throw NotFoundException if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                'Subscriber with ID non-existent-id not found',
            );
        });
    });

    describe('findByEmail', () => {
        it('should return a subscriber by email', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);

            const result = await service.findByEmail(mockSubscriber.email);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: mockSubscriber.email },
            });
            expect(result).toEqual(mockSubscriber);
        });

        it('should throw NotFoundException if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
                'Subscriber with email nonexistent@example.com not found',
            );
        });
    });

    describe('update', () => {
        it('should update a subscriber', async () => {
            const updateDto: UpdateSubscriberDto = {
                status: 'unsubscribed',
            };

            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.save.mockResolvedValue({
                ...mockSubscriber,
                ...updateDto,
            });

            const result = await service.update(mockSubscriber.id, updateDto);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockSubscriber.id },
            });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining(updateDto));
        });

        it('should throw NotFoundException if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                service.update('non-existent-id', {}),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should remove a subscriber', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.remove.mockResolvedValue(mockSubscriber);

            await service.remove(mockSubscriber.id);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockSubscriber.id },
            });
            expect(mockRepository.remove).toHaveBeenCalledWith(mockSubscriber);
        });

        it('should throw NotFoundException if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('non-existent-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('subscribe', () => {
        it('should update existing subscriber to active', async () => {
            const existingSubscriber = { ...mockSubscriber, status: 'unsubscribed' };
            mockRepository.findOne.mockResolvedValue(existingSubscriber);
            mockRepository.save.mockResolvedValue({
                ...existingSubscriber,
                status: 'active',
            });

            const result = await service.subscribe(mockSubscriber.email);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: mockSubscriber.email },
            });
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'active',
                }),
            );
            expect(result.status).toBe('active');
        });

        it('should create new subscriber if not exists', async () => {
            const validationResult = { status: 'valid', score: 100 };
            mockRepository.findOne.mockResolvedValue(null);
            mockAdvancedEmailValidationService.validateEmail.mockResolvedValue(validationResult);
            mockRepository.create.mockReturnValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            const result = await service.subscribe('new@example.com', '192.168.1.1');

            expect(mockAdvancedEmailValidationService.validateEmail).toHaveBeenCalledWith(
                'new@example.com',
                '192.168.1.1',
            );
            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'new@example.com',
                    status: 'active',
                    mailerCheckResult: 'valid',
                }),
            );
            expect(result).toEqual(mockSubscriber);
        });

        it('should update lastUpdated timestamp', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            await service.subscribe(mockSubscriber.email);

            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    lastUpdated: expect.any(Date),
                }),
            );
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe a subscriber', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.save.mockResolvedValue({
                ...mockSubscriber,
                status: 'unsubscribed',
            });

            const result = await service.unsubscribe(mockSubscriber.email);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: mockSubscriber.email },
            });
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'unsubscribed',
                }),
            );
            expect(result.status).toBe('unsubscribed');
        });

        it('should throw NotFoundException if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.unsubscribe('nonexistent@example.com')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should update lastUpdated timestamp', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            await service.unsubscribe(mockSubscriber.email);

            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    lastUpdated: expect.any(Date),
                }),
            );
        });
    });

    describe('updateStatusFromWebhook', () => {
        it('should update subscriber status from webhook', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.save.mockResolvedValue({
                ...mockSubscriber,
                status: 'bounced',
            });

            const result = await service.updateStatusFromWebhook(
                mockSubscriber.email,
                'bounced',
                { bounceType: 'hard' },
            );

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { email: mockSubscriber.email },
            });
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'bounced',
                    mailerCheckResult: 'hard',
                }),
            );
            expect(result.status).toBe('bounced');
        });

        it('should return null if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.updateStatusFromWebhook(
                'nonexistent@example.com',
                'bounced',
            );

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            mockRepository.findOne.mockRejectedValue(new Error('Database error'));

            const result = await service.updateStatusFromWebhook(
                mockSubscriber.email,
                'bounced',
            );

            expect(result).toBeNull();
        });

        it('should update lastUpdated timestamp', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubscriber);
            mockRepository.save.mockResolvedValue(mockSubscriber);

            await service.updateStatusFromWebhook(mockSubscriber.email, 'complained');

            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    lastUpdated: expect.any(Date),
                }),
            );
        });
    });

    describe('isEmailSuppressed', () => {
        it('should return true if email is bounced', async () => {
            mockRepository.findOne.mockResolvedValue({
                ...mockSubscriber,
                status: 'bounced',
            });

            const result = await service.isEmailSuppressed(mockSubscriber.email);

            expect(result).toBe(true);
        });

        it('should return true if email is complained', async () => {
            mockRepository.findOne.mockResolvedValue({
                ...mockSubscriber,
                status: 'complained',
            });

            const result = await service.isEmailSuppressed(mockSubscriber.email);

            expect(result).toBe(true);
        });

        it('should return true if email is unsubscribed', async () => {
            mockRepository.findOne.mockResolvedValue({
                ...mockSubscriber,
                status: 'unsubscribed',
            });

            const result = await service.isEmailSuppressed(mockSubscriber.email);

            expect(result).toBe(true);
        });

        it('should return false if email is active', async () => {
            mockRepository.findOne.mockResolvedValue({
                ...mockSubscriber,
                status: 'active',
            });

            const result = await service.isEmailSuppressed(mockSubscriber.email);

            expect(result).toBe(false);
        });

        it('should return false if subscriber not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.isEmailSuppressed('nonexistent@example.com');

            expect(result).toBe(false);
        });
    });
});
