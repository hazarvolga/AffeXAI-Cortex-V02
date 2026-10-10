import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchProcessorService } from './batch-processor.service';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { ChatDataExtractorService } from './chat-data-extractor.service';
import { TicketDataExtractorService } from './ticket-data-extractor.service';
import { DataNormalizerService } from './data-normalizer.service';

describe('BatchProcessorService', () => {
    let service: BatchProcessorService;
    let configRepository: Repository<FaqLearningConfig>;
    let chatExtractor: ChatDataExtractorService;
    let ticketExtractor: TicketDataExtractorService;
    let dataNormalizer: DataNormalizerService;

    const mockConfigRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockChatExtractor = {
        extract: jest.fn(),
    };

    const mockTicketExtractor = {
        extract: jest.fn(),
    };

    const mockDataNormalizer = {
        normalize: jest.fn(data => Promise.resolve(data)),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BatchProcessorService,
                {
                    provide: getRepositoryToken(FaqLearningConfig),
                    useValue: mockConfigRepository,
                },
                {
                    provide: ChatDataExtractorService,
                    useValue: mockChatExtractor,
                },
                {
                    provide: TicketDataExtractorService,
                    useValue: mockTicketExtractor,
                },
                {
                    provide: DataNormalizerService,
                    useValue: mockDataNormalizer,
                },
            ],
        }).compile();

        service = module.get<BatchProcessorService>(BatchProcessorService);
        configRepository = module.get(getRepositoryToken(FaqLearningConfig));
        chatExtractor = module.get(ChatDataExtractorService);
        ticketExtractor = module.get(TicketDataExtractorService);
        dataNormalizer = module.get(DataNormalizerService);

        jest.clearAllMocks();
    });

    describe('processBatch', () => {
        it('should process both sources if configured', async () => {
            mockConfigRepository.findOne.mockResolvedValue({
                batchSize: 10,
                enableChatProcessing: true,
                enableTicketProcessing: true
            });
            mockChatExtractor.extract.mockResolvedValue([{ id: '1' }]);
            mockTicketExtractor.extract.mockResolvedValue([{ id: '2' }]);

            const result = await service.processBatch();

            expect(result.chatDataExtracted).toBe(1);
            expect(result.ticketDataExtracted).toBe(1);
            expect(result.totalExtracted).toBe(2);
        });

        it('should respect options overrides', async () => {
            mockConfigRepository.findOne.mockResolvedValue({
                enableChatProcessing: false
            });
            // Override to include chat
            mockChatExtractor.extract.mockResolvedValue([{ id: '1' }]);

            const result = await service.processBatch({ includeChat: true });

            expect(result.chatDataExtracted).toBe(1);
        });
    });

    describe('processSpecificSources', () => {
        it('should process specific IDs', async () => {
            mockChatExtractor.extract.mockResolvedValue([]); // Should be called with specific IDs logic inside extract (if impl supports criteria with IDs)
            // Assuming extract method supports ID filtering via criteria
            // Mocking response directly for simplicity of unit test flow verification

            await service.processSpecificSources(['chat-1'], ['ticket-1']);

            expect(mockChatExtractor.extract).toHaveBeenCalled();
            expect(mockTicketExtractor.extract).toHaveBeenCalled();
        });
    });

    describe('getProcessingStatus', () => {
        it('should return status', async () => {
            mockConfigRepository.findOne.mockResolvedValue({
                lastRun: new Date(),
                totalProcessed: 100
            });

            const status = await service.getProcessingStatus();

            expect(status.totalProcessed).toBe(100);
        });
    });

    describe('updateProcessingStats', () => {
        it('should update stats in config', async () => {
            mockConfigRepository.findOne.mockResolvedValue({ totalProcessed: 0 });

            await service.updateProcessingStats({
                totalProcessed: 10,
                chatDataExtracted: 5,
                ticketDataExtracted: 5,
                totalExtracted: 10,
                averageConfidence: 0.8,
                processingTimeMs: 100,
                errors: []
            });

            expect(mockConfigRepository.save).toHaveBeenCalled();
        });
    });
});
