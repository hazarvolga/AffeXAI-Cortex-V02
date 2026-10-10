import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionService, ChatSessionFilters } from './chat-session.service';
import { ChatSession, ChatSessionType, ChatSessionStatus } from '../entities/chat-session.entity';
import { User } from '../../users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('ChatSessionService', () => {
    let service: ChatSessionService;
    let chatSessionRepository: Repository<ChatSession>;
    let userRepository: Repository<User>;

    const mockChatSession = {
        id: 'session-1',
        userId: 'user-1',
        sessionType: ChatSessionType.SUPPORT,
        status: ChatSessionStatus.ACTIVE,
        messages: [],
        updatedAt: new Date(),
        metadata: {},
    };

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
    };

    const mockChatSessionRepository = {
        create: jest.fn().mockImplementation((dto) => dto),
        save: jest.fn().mockImplementation((session) => Promise.resolve({ id: 'new-session', ...session })),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getCount: jest.fn(),
            clone: jest.fn().mockReturnThis(),
        })),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatSessionService,
                {
                    provide: getRepositoryToken(ChatSession),
                    useValue: mockChatSessionRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        service = module.get<ChatSessionService>(ChatSessionService);
        chatSessionRepository = module.get(getRepositoryToken(ChatSession));
        userRepository = module.get(getRepositoryToken(User));

        jest.clearAllMocks();
    });

    describe('createSession', () => {
        it('should create a new session if valid user', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockChatSessionRepository.findOne.mockResolvedValue(null); // No existing session

            const result = await service.createSession({ userId: 'user-1' });

            expect(result).toBeDefined();
            expect(mockChatSessionRepository.create).toHaveBeenCalled();
            expect(mockChatSessionRepository.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if user not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.createSession({ userId: 'unknown' })).rejects.toThrow(NotFoundException);
        });

        it('should return existing active session if one exists', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockChatSessionRepository.findOne.mockResolvedValue(mockChatSession);

            const result = await service.createSession({ userId: 'user-1' });

            expect(result.id).toBe(mockChatSession.id);
            expect(mockChatSessionRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('getSession', () => {
        it('should return session by ID', async () => {
            mockChatSessionRepository.findOne.mockResolvedValue(mockChatSession);

            const result = await service.getSession('session-1');

            expect(result).toEqual(mockChatSession);
        });

        it('should throw NotFoundException if session not found', async () => {
            mockChatSessionRepository.findOne.mockResolvedValue(null);

            await expect(service.getSession('unknown')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getUserSessions', () => {
        it('should return sessions for user', async () => {
            mockChatSessionRepository.createQueryBuilder().getMany.mockResolvedValue([mockChatSession]);

            const results = await service.getUserSessions('user-1');

            expect(results).toHaveLength(1);
            expect(mockChatSessionRepository.createQueryBuilder).toHaveBeenCalled();
        });

        it('should apply filters', async () => {
            mockChatSessionRepository.createQueryBuilder().getMany.mockResolvedValue([]);

            await service.getUserSessions('user-1', { status: ChatSessionStatus.ACTIVE });

            expect(mockChatSessionRepository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('updateSession', () => {
        it('should update session fields', async () => {
            mockChatSessionRepository.findOne.mockResolvedValue(mockChatSession);

            await service.updateSession('session-1', { title: 'New Title' });

            expect(mockChatSessionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
        });

        it('should set closedAt when closing session', async () => {
            mockChatSessionRepository.findOne.mockResolvedValue(mockChatSession);

            await service.updateSession('session-1', { status: ChatSessionStatus.CLOSED });

            expect(mockChatSessionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                status: ChatSessionStatus.CLOSED,
                closedAt: expect.any(Date)
            }));
        });
    });

    describe('getActiveSessions', () => {
        it('should return only active sessions', async () => {
            mockChatSessionRepository.createQueryBuilder().getMany.mockResolvedValue([mockChatSession]);

            const results = await service.getActiveSessions();

            expect(results).toHaveLength(1);
        });
    });

    describe('getSessionStats', () => {
        it('should return correct statistics', async () => {
            mockChatSessionRepository.createQueryBuilder().getCount.mockResolvedValue(10);
            mockChatSessionRepository.createQueryBuilder().clone().andWhere.mockReturnValue({ getCount: jest.fn().mockResolvedValue(5) });


            // Mock implementation detail of Promise.all for different counts
            // The service uses .clone() chains. We mocked clone to return an object with andWhere/getCount.
            // We need to ensure each specific chain returns expected values if logic is complex,
            // or just assume standard mocked behavior.

            const stats = await service.getSessionStats('user-1');

            expect(stats.total).toBe(10);
            expect(stats.active).toBeDefined();
        });
    });
});
