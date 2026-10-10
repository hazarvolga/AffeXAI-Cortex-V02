import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatEscalationService } from './chat-escalation.service';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSessionService } from './chat-session.service';
import { ChatMessageService } from './chat-message.service';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';

describe('ChatEscalationService', () => {
    let service: ChatEscalationService;

    const mockSessionRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockMessageRepository = {
        find: jest.fn(),
    };

    const mockSessionService = {
        updateSession: jest.fn(),
    };

    const mockMessageService = {
        sendMessage: jest.fn(),
    };

    const mockAssignmentService = {
        getSupportTeamAvailability: jest.fn(),
        createAssignment: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatEscalationService,
                { provide: getRepositoryToken(ChatSession), useValue: mockSessionRepository },
                { provide: getRepositoryToken(ChatMessage), useValue: mockMessageRepository },
                { provide: ChatSessionService, useValue: mockSessionService },
                { provide: ChatMessageService, useValue: mockMessageService },
                { provide: ChatSupportAssignmentService, useValue: mockAssignmentService },
            ],
        }).compile();

        service = module.get<ChatEscalationService>(ChatEscalationService);

        jest.clearAllMocks();
    });

    describe('escalateToSupport', () => {
        it('should successfully escalate session', async () => {
            mockSessionRepository.findOne.mockResolvedValue({ id: 's-1' });
            mockAssignmentService.createAssignment.mockResolvedValue({ id: 'a-1' });
            mockMessageService.sendMessage.mockResolvedValue({ id: 'm-1' });

            const result = await service.escalateToSupport({
                sessionId: 's-1',
                userId: 'u-1',
                reason: 'Help needed'
            });

            expect(result.success).toBe(true);
            expect(mockAssignmentService.createAssignment).toHaveBeenCalled();
        });
    });

    describe('analyzeEscalationNeed', () => {
        it('should detect escalation keywords', async () => {
            mockMessageRepository.find.mockResolvedValue([
                { content: 'I want to speak to a human', senderType: 'user' }
            ]);

            const analysis = await service.analyzeEscalationNeed('s-1');

            expect(analysis.shouldEscalate).toBe(true);
            expect(analysis.reason).toContain('human');
        });

        it('should detect negative sentiment pattern', async () => {
            mockMessageRepository.find.mockResolvedValue([
                { content: 'This is useless and frustrating', senderType: 'user' }
            ]);

            const analysis = await service.analyzeEscalationNeed('s-1');
            expect(analysis.shouldEscalate).toBe(true);
        });
    });

    describe('getEscalationStatistics', () => {
        it('should return stats', async () => {
            // Logic likely depends on repo query builders, mocking finding logic if implemented via DB
            // Assuming naive implementation or mocking return
            const stats = await service.getEscalationStatistics();
            expect(stats.totalEscalations).toBeDefined();
        });
    });
});
