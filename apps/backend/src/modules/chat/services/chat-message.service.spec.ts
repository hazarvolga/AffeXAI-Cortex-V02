import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessageService } from './chat-message.service';
import { ChatSessionService } from './chat-session.service';
import { ChatMessage, ChatMessageSenderType, ChatMessageType } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { NotFoundException } from '@nestjs/common';

describe('ChatMessageService', () => {
    let service: ChatMessageService;
    let chatMessageRepository: Repository<ChatMessage>;
    let chatSessionRepository: Repository<ChatSession>;
    let chatSessionService: ChatSessionService;

    const mockMessage = {
        id: 'msg-1',
        content: 'Hello',
        sessionId: 'session-1',
        senderType: ChatMessageSenderType.USER,
        createdAt: new Date(),
    };

    const mockSession = {
        id: 'session-1',
        messages: [],
    };

    const mockChatMessageRepository = {
        create: jest.fn().mockImplementation((dto) => dto),
        save: jest.fn().mockImplementation((msg) => Promise.resolve({ id: 'new-msg', ...msg })),
        findOne: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getCount: jest.fn(),
            clone: jest.fn().mockReturnThis(),
        })),
    };

    const mockChatSessionRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockChatSessionService = {
        getSession: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatMessageService,
                {
                    provide: getRepositoryToken(ChatMessage),
                    useValue: mockChatMessageRepository,
                },
                {
                    provide: getRepositoryToken(ChatSession),
                    useValue: mockChatSessionRepository,
                },
                {
                    provide: ChatSessionService,
                    useValue: mockChatSessionService,
                },
            ],
        }).compile();

        service = module.get<ChatMessageService>(ChatMessageService);
        chatMessageRepository = module.get(getRepositoryToken(ChatMessage));
        chatSessionRepository = module.get(getRepositoryToken(ChatSession));

        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        it('should create and save a new message', async () => {
            mockChatSessionService.getSession.mockResolvedValue(mockSession);

            const result = await service.sendMessage({
                sessionId: 'session-1',
                content: 'Hello',
                senderType: ChatMessageSenderType.USER
            });

            expect(result).toBeDefined();
            expect(mockChatMessageRepository.create).toHaveBeenCalled();
            expect(mockChatMessageRepository.save).toHaveBeenCalled();
        });

        it('should update session last message timestamp', async () => {
            mockChatSessionService.getSession.mockResolvedValue(mockSession);
            mockChatMessageRepository.save.mockResolvedValue(mockMessage);

            await service.sendMessage({
                sessionId: 'session-1',
                content: 'Hello',
                senderType: ChatMessageSenderType.USER
            });

            expect(mockChatSessionRepository.save).toHaveBeenCalled();
        });
    });

    describe('getMessages', () => {
        it('should return messages for a session', async () => {
            mockChatMessageRepository.find.mockResolvedValue([mockMessage]);

            const results = await service.getMessages('session-1');

            expect(results).toHaveLength(1);
            expect(mockChatMessageRepository.find).toHaveBeenCalledWith(expect.objectContaining({
                where: { sessionId: 'session-1' }
            }));
        });
    });

    describe('updateMessage', () => {
        it('should update message content', async () => {
            mockChatMessageRepository.findOne.mockResolvedValue(mockMessage);
            mockChatMessageRepository.save.mockResolvedValue({ ...mockMessage, content: 'Updated' });

            const result = await service.updateMessage('msg-1', { content: 'Updated' });

            expect(result.content).toBe('Updated');
        });

        it('should throw if message not found', async () => {
            mockChatMessageRepository.findOne.mockResolvedValue(null);

            await expect(service.updateMessage('unknown', {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteMessage', () => {
        it('should delete message', async () => {
            mockChatMessageRepository.findOne.mockResolvedValue(mockMessage);

            await service.deleteMessage('msg-1');

            expect(mockChatMessageRepository.delete).toHaveBeenCalledWith('msg-1');
        });
    });

    describe('getRecentMessages', () => {
        it('should retrieve latest messages', async () => {
            mockChatMessageRepository.createQueryBuilder().getMany.mockResolvedValue([mockMessage]);

            const results = await service.getRecentMessages();

            expect(results).toHaveLength(1);
        });
    });

    describe('searchMessages', () => {
        it('should search by content', async () => {
            mockChatMessageRepository.createQueryBuilder().getMany.mockResolvedValue([mockMessage]);

            const results = await service.searchMessages('Hello');

            expect(results).toHaveLength(1);
            expect(mockChatMessageRepository.createQueryBuilder).toHaveBeenCalled();
        });
    });
});
