import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineStateService } from './pipeline-state.service';
import { PipelineState, PipelineStatus } from '../entities/pipeline-state.entity';

describe('PipelineStateService', () => {
    let service: PipelineStateService;
    let repository: Repository<PipelineState>;

    const mockState = {
        id: 'state-1',
        status: PipelineStatus.STOPPED,
        dailyProcessingCount: 0,
        totalFaqsGenerated: 0,
        processingConfig: {
            mode: 'manual',
        },
        updatedAt: new Date(),
    };

    const mockRepository = {
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PipelineStateService,
                {
                    provide: getRepositoryToken(PipelineState),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PipelineStateService>(PipelineStateService);
        repository = module.get(getRepositoryToken(PipelineState));

        jest.clearAllMocks();
    });

    describe('getState', () => {
        it('should return existing state', async () => {
            mockRepository.find.mockResolvedValue([mockState]);

            const state = await service.getState();

            expect(state).toEqual(mockState);
        });

        it('should create initial state if none exists', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.create.mockReturnValue(mockState);
            mockRepository.save.mockResolvedValue(mockState);

            const state = await service.getState();

            expect(mockRepository.create).toHaveBeenCalled();
            expect(state).toEqual(mockState);
        });
    });

    describe('updateStatus', () => {
        it('should update status and timestamp', async () => {
            mockRepository.find.mockResolvedValue([mockState]);
            mockRepository.save.mockResolvedValue({ ...mockState, status: PipelineStatus.RUNNING });

            const state = await service.updateStatus(PipelineStatus.RUNNING);

            expect(state.status).toBe(PipelineStatus.RUNNING);
        });

        it('should record error details', async () => {
            mockRepository.find.mockResolvedValue([mockState]);

            await service.updateStatus(PipelineStatus.ERROR, { message: 'Test Error' });

            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                lastError: expect.objectContaining({ message: 'Test Error' })
            }));
        });
    });

    describe('start/stop', () => {
        it('should start pipeline', async () => {
            jest.spyOn(service, 'updateStatus').mockResolvedValue({} as any);
            await service.start();
            expect(service.updateStatus).toHaveBeenCalledWith(PipelineStatus.RUNNING);
        });

        it('should stop pipeline', async () => {
            jest.spyOn(service, 'updateStatus').mockResolvedValue({} as any);
            await service.stop();
            expect(service.updateStatus).toHaveBeenCalledWith(PipelineStatus.STOPPED);
        });
    });

    describe('Counters', () => {
        it('should increment daily count', async () => {
            mockRepository.find.mockResolvedValue([mockState]);

            await service.incrementDailyCount();

            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                dailyProcessingCount: 1
            }));
        });

        it('should reset daily count', async () => {
            mockRepository.find.mockResolvedValue([{ ...mockState, dailyProcessingCount: 10 }]);

            await service.resetDailyCount();

            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                dailyProcessingCount: 0
            }));
        });
    });

    describe('updateConfig', () => {
        it('should merge config updates', async () => {
            mockRepository.find.mockResolvedValue([mockState]);

            await service.updateConfig({ batchSize: 100 });

            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                processingConfig: expect.objectContaining({ batchSize: 100 })
            }));
        });
    });
});
