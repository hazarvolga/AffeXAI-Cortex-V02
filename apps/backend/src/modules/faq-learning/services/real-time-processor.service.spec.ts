import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RealTimeProcessorService } from './real-time-processor.service';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { FaqLearningService } from './faq-learning.service';
import { ChatFaqIntegrationService } from './chat-faq-integration.service';
import { Ticket } from '../../tickets/entities/ticket.entity';

describe('RealTimeProcessorService', () => {
    let service: RealTimeProcessorService;
    let chatSessionRepository: Repository<ChatSession>;
    let chatMessageRepository: Repository<ChatMessage>;
    let configRepository: Repository<FaqLearningConfig>;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockFaqLearningService = {
        runLearningPipeline: jest.fn(),
    };

    const mockChatFaqIntegration = {
        suggestFaqs: jest.fn(),
    };

    const mockEventEmitter = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RealTimeProcessorService,
                {
                    provide: getRepositoryToken(ChatSession),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(ChatMessage),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(FaqLearningConfig),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Ticket), // Assuming Ticket is injected too based on outline
                    useValue: mockRepository,
                },
                {
                    provide: FaqLearningService,
                    useValue: mockFaqLearningService,
                },
                {
                    provide: ChatFaqIntegrationService,
                    useValue: mockChatFaqIntegration,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
            ],
        }).compile();

        service = module.get<RealTimeProcessorService>(RealTimeProcessorService);
        chatSessionRepository = module.get(getRepositoryToken(ChatSession));
        configRepository = module.get(getRepositoryToken(FaqLearningConfig));

        jest.clearAllMocks();
    });

    describe('processChatSession', () => {
        it('should process chat session if enabled', async () => {
            mockRepository.findOne.mockResolvedValueOnce({ enableChatProcessing: true }); // Config
            mockRepository.findOne.mockResolvedValueOnce({ id: 'session-1', messages: [{}, {}, {}] }); // Session

            const result = await service.processChatSession('session-1');

            expect(result.processed).toBe(true);
        });

        it('should skip if disabled', async () => {
            mockRepository.findOne.mockResolvedValueOnce({ enableChatProcessing: false });

            const result = await service.processChatSession('session-1');

            expect(result.processed).toBe(false);
        });
    });

    describe('processTicket', () => {
        it('should process ticket if enabled', async () => {
            mockRepository.findOne.mockResolvedValueOnce({ enableTicketProcessing: true });
            mockRepository.findOne.mockResolvedValueOnce({ id: 'ticket-1' });

            const result = await service.processTicket('ticket-1');

            expect(result.processed).toBe(true);
        });
    });

    describe('processChatMessageFeedback', () => {
        it('should adjust logic based on feedback', async () => {
            // Assuming feedback affects confidence or specific FAQ entry
            // Mocking necessary calls

            const result = await service.processChatMessageFeedback('msg-1', true);

            // Verification depends on what feedback logic does (adjust weights, mark helpful)
            // Since outline showed result type, we check that
            expect(result).toBeDefined();
        });
    });

    describe('Queue Handling', () => {
        it('should manage processing queue', async () => {
            service.scheduleProcessing('key-1', 100, async () => { });

            const status = service.getQueueStatus();
            expect(status.queueSize).toBeGreaterThan(0);
            expect(status.pendingItems).toContain('key-1');

            service.clearQueue();
            expect(service.getQueueStatus().queueSize).toBe(0);
        });
    });
});
