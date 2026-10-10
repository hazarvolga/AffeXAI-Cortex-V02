import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationService } from '../services/automation.service';
import { EmailAutomation } from '../entities/email-automation.entity';
import { AutomationExecution } from '../entities/automation-execution.entity';
import { Subscriber } from '../entities/subscriber.entity';

describe('AutomationService', () => {
    let service: AutomationService;
    let automationRepository: Repository<EmailAutomation>;
    let executionRepository: Repository<AutomationExecution>;
    let subscriberRepository: Repository<Subscriber>;

    const mockAutomation: Partial<EmailAutomation> = {
        id: '123',
        name: 'Welcome Series',
        triggerType: 'subscriber_added',
        isActive: true,
        steps: [],
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getCount: jest.fn(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AutomationService,
                {
                    provide: getRepositoryToken(EmailAutomation),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(AutomationExecution),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<AutomationService>(AutomationService);
        automationRepository = module.get(getRepositoryToken(EmailAutomation));
        executionRepository = module.get(getRepositoryToken(AutomationExecution));
        subscriberRepository = module.get(getRepositoryToken(Subscriber));

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new automation', async () => {
            mockRepository.create.mockReturnValue(mockAutomation);
            mockRepository.save.mockResolvedValue(mockAutomation);

            const result = await service.create({
                name: 'Welcome Series',
                triggerType: 'subscriber_added',
                steps: [],
            });

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockAutomation);
        });
    });

    describe('findAll', () => {
        it('should return all automations', async () => {
            mockRepository.find.mockResolvedValue([mockAutomation]);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual([mockAutomation]);
        });
    });

    describe('findOne', () => {
        it('should return an automation by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockAutomation);

            const result = await service.findOne('123');

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(result).toEqual(mockAutomation);
        });
    });

    describe('update', () => {
        it('should update an automation', async () => {
            mockRepository.findOne.mockResolvedValue(mockAutomation);
            mockRepository.save.mockResolvedValue({ ...mockAutomation, name: 'Updated' });

            const result = await service.update('123', { name: 'Updated' });

            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.name).toBe('Updated');
        });
    });

    describe('remove', () => {
        it('should remove an automation', async () => {
            mockRepository.findOne.mockResolvedValue(mockAutomation);
            mockRepository.remove.mockResolvedValue(mockAutomation);

            await service.remove('123');

            expect(mockRepository.remove).toHaveBeenCalled();
        });
    });

    describe('activate', () => {
        it('should activate an automation', async () => {
            mockRepository.findOne.mockResolvedValue({ ...mockAutomation, isActive: false });
            mockRepository.save.mockResolvedValue({ ...mockAutomation, isActive: true });

            const result = await service.activate('123');

            expect(result.isActive).toBe(true);
        });
    });

    describe('deactivate', () => {
        it('should deactivate an automation', async () => {
            mockRepository.findOne.mockResolvedValue(mockAutomation);
            mockRepository.save.mockResolvedValue({ ...mockAutomation, isActive: false });

            const result = await service.deactivate('123');

            expect(result.isActive).toBe(false);
        });
    });

    describe('getExecutions', () => {
        it('should return executions for an automation', async () => {
            const executions = [{ id: '1', automationId: '123', status: 'completed' }];
            mockRepository.find.mockResolvedValue(executions);

            const result = await service.getExecutions('123');

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual(executions);
        });
    });

    describe('getAnalytics', () => {
        it('should return analytics for an automation', async () => {
            mockRepository.createQueryBuilder().getCount.mockResolvedValue(100);

            const result = await service.getAnalytics('123');

            expect(result).toHaveProperty('totalExecutions');
            expect(result).toHaveProperty('completedExecutions');
        });
    });
});
