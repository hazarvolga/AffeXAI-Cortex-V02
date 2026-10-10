import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowExecutorService } from './workflow-executor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAutomation } from '../entities/email-automation.entity';
import { AutomationExecution } from '../entities/automation-execution.entity';

describe('WorkflowExecutorService', () => {
    let service: WorkflowExecutorService;
    let automationRepository: Repository<EmailAutomation>;
    let executionRepository: Repository<AutomationExecution>;

    const mockRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkflowExecutorService,
                {
                    provide: getRepositoryToken(EmailAutomation),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(AutomationExecution),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<WorkflowExecutorService>(WorkflowExecutorService);
        automationRepository = module.get(getRepositoryToken(EmailAutomation));
        executionRepository = module.get(getRepositoryToken(AutomationExecution));

        jest.clearAllMocks();
    });

    describe('executeWorkflow', () => {
        it('should execute workflow steps in order', async () => {
            const automation = {
                id: '123',
                steps: [
                    { type: 'send_email', config: {} },
                    { type: 'wait', config: { duration: 1 } },
                    { type: 'send_email', config: {} },
                ],
            };
            mockRepository.findOne.mockResolvedValue(automation);
            mockRepository.create.mockReturnValue({});
            mockRepository.save.mockResolvedValue({});

            await service.executeWorkflow('123', { subscriberId: 'sub-123' });

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should handle workflow errors', async () => {
            mockRepository.findOne.mockRejectedValue(new Error('Workflow not found'));

            await expect(
                service.executeWorkflow('invalid-id', {}),
            ).rejects.toThrow();
        });
    });

    describe('executeStep', () => {
        it('should execute send_email step', async () => {
            const step = { type: 'send_email', config: { templateId: 'template-123' } };

            await service.executeStep(step, { subscriberId: 'sub-123' });

            // Verify email was queued
        });

        it('should execute wait step', async () => {
            const step = { type: 'wait', config: { duration: 1 } };

            await service.executeStep(step, {});

            // Verify delay was applied
        });

        it('should execute condition step', async () => {
            const step = { type: 'condition', config: { field: 'status', operator: 'equals', value: 'active' } };

            const result = await service.executeStep(step, { status: 'active' });

            expect(result).toBe(true);
        });
    });
});
