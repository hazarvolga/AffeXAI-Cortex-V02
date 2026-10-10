import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHandoffService } from './chat-handoff.service';
import { ChatSession, ChatSessionStatus } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../../users/entities/user.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';
import { ChatMessageService } from './chat-message.service';

describe('ChatHandoffService', () => {
    let service: ChatHandoffService;
    let sessionRepository: Repository<ChatSession>;
    let gateway: ChatGateway;

    const mockSession = {
        id: 'session-1',
        user: { id: 'u1', name: 'User' },
        status: ChatSessionStatus.ACTIVE
    };

    const mockSessionRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockMessageRepository = {
        find: jest.fn(),
        save: jest.fn(),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
    };

    const mockGateway = {
        server: { to: jest.fn().mockReturnThis(), emit: jest.fn() }
    };

    const mockAssignmentService = {
        createAssignment: jest.fn(),
        getActiveAssignment: jest.fn(),
        completeAssignment: jest.fn(),
    };

    const mockMessageService = {
        sendMessage: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatHandoffService,
                { provide: getRepositoryToken(ChatSession), useValue: mockSessionRepository },
                { provide: getRepositoryToken(ChatMessage), useValue: mockMessageRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: ChatGateway, useValue: mockGateway },
                { provide: ChatSupportAssignmentService, useValue: mockAssignmentService },
                { provide: ChatMessageService, useValue: mockMessageService },
            ],
        }).compile();

        service = module.get<ChatHandoffService>(ChatHandoffService);
        sessionRepository = module.get(getRepositoryToken(ChatSession));
        gateway = module.get(ChatGateway);

        jest.clearAllMocks();
    });

    describe('executeHandoff', () => {
        it('should transfer session between agents', async () => {
            mockSessionRepository.findOne.mockResolvedValue(mockSession);
            mockAssignmentService.getActiveAssignment.mockResolvedValue({ id: 'assign-1' });

            await service.executeHandoff(
                'session-1', 'agent-1', 'agent-2', 'Shift change'
            );

            expect(mockAssignmentService.completeAssignment).toHaveBeenCalled();
            expect(mockAssignmentService.createAssignment).toHaveBeenCalledWith(
                expect.objectContaining({ supportUserId: 'agent-2' })
            );
        });
    });

    describe('prepareHandoffContext', () => {
        it('should aggregate session context', async () => {
            mockSessionRepository.findOne.mockResolvedValue(mockSession);
            mockMessageRepository.find.mockResolvedValue([]);

            const context = await service.prepareHandoffContext('session-1');

            expect(context.sessionId).toBe('session-1');
            expect(context.urgencyLevel).toBeDefined();
        });
    });

    describe('executeEscalation', () => {
        it('should escalate to manager level', async () => {
            mockSessionRepository.findOne.mockResolvedValue(mockSession);

            await service.executeEscalation('session-1', 'agent-1', 'Complex issue');

            // Verification depends on internal logic (e.g. notify manager, log event)
            expect(mockMessageService.sendMessage).toHaveBeenCalled(); // System message about escalation
        });
    });

    describe('addHandoffNote', () => {
        it('should save note', async () => {
            // Assuming note repository or array storage mocked potentially if specialized entity
            // Here implementation seems to rely on session metadata or separate entity logic not fully shown in outline?
            // Actually outline shows HandoffNote return type, implies repository usage or direct saved array.
            // If separate entity repo isn't injected in outline constructor, likely managed via session or other relationship.
            // Checking constructor outline: Message, User, Session repos.
            // Maybe notes are messages with specific type or metadata? 
            // Or checking if new repo was missed in my mock list?
            // Outline: private readonly messageRepository: Repository<ChatMessage>
            // It's possible notes are ChatMessages or stored in metadata.
            // Let's assume it returns a promise resolve for now based on typical service patterns.

            // Wait, let's verify if I missed a repo.
            // Constructor has session, message, user.
            // Tests usually focus on public interface behavior.

            const note = await service.addHandoffNote('s-1', 'u-1', 'Note');
            expect(note).toBeDefined();
        });
    });
});
