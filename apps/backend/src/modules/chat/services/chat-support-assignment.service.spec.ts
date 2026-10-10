import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';
import { ChatSupportAssignment, AssignmentStatus } from '../entities/chat-support-assignment.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { User } from '../../users/entities/user.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { NotFoundException } from '@nestjs/common';

describe('ChatSupportAssignmentService', () => {
    let service: ChatSupportAssignmentService;
    let assignmentRepository: Repository<ChatSupportAssignment>;

    const mockAssignmentRepository = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(a => Promise.resolve({ id: 'a-1', ...a })),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getOne: jest.fn(),
        })),
    };

    const mockSessionRepository = { findOne: jest.fn() };
    const mockUserRepository = { findOne: jest.fn() };
    const mockGateway = { server: { to: jest.fn().mockReturnThis(), emit: jest.fn() } };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatSupportAssignmentService,
                { provide: getRepositoryToken(ChatSupportAssignment), useValue: mockAssignmentRepository },
                { provide: getRepositoryToken(ChatSession), useValue: mockSessionRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: ChatGateway, useValue: mockGateway },
            ],
        }).compile();

        service = module.get<ChatSupportAssignmentService>(ChatSupportAssignmentService);
        assignmentRepository = module.get(getRepositoryToken(ChatSupportAssignment));

        jest.clearAllMocks();
    });

    describe('createAssignment', () => {
        it('should create assignment', async () => {
            mockSessionRepository.findOne.mockResolvedValue({ id: 's-1' });
            mockUserRepository.findOne.mockResolvedValue({ id: 'u-1' });
            // Ensure no active assignment exists
            mockAssignmentRepository.findOne.mockResolvedValue(null);

            const result = await service.createAssignment({
                sessionId: 's-1',
                supportUserId: 'u-1'
            });

            expect(result).toBeDefined();
            expect(mockAssignmentRepository.save).toHaveBeenCalled();
        });
    });

    describe('completeAssignment', () => {
        it('should complete active assignment', async () => {
            mockAssignmentRepository.findOne.mockResolvedValue({
                id: 'a-1',
                status: AssignmentStatus.ACTIVE
            });

            const result = await service.completeAssignment('s-1', 'u-1');

            expect(result.status).toBe(AssignmentStatus.COMPLETED);
        });

        it('should throw if no active assignment', async () => {
            mockAssignmentRepository.findOne.mockResolvedValue(null);
            await expect(service.completeAssignment('s-1', 'u-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getSupportTeamAvailability', () => {
        it('should return availability stats', async () => {
            mockUserRepository.find = jest.fn().mockResolvedValue([{ id: 'u-1', name: 'Agent' }]);
            mockAssignmentRepository.count = jest.fn().mockResolvedValue(2);

            // Assuming implementation fetches users then counts assignments
            // We might need to mock queryBuilder if implementation uses it for sophisticated logic
            // But standard list mock might suffice if logic is simple.
            // Outline suggests checking isOnline etc.

            const availability = await service.getSupportTeamAvailability();
            expect(availability).toBeDefined();
        });
    });

    describe('autoAssignSupport', () => {
        it('should assign valid agent', async () => {
            // Mock finding available agent
            jest.spyOn(service, 'getSupportTeamAvailability').mockResolvedValue([{
                userId: 'u-1',
                isAvailable: true,
                activeAssignments: 0
            }] as any);

            mockSessionRepository.findOne.mockResolvedValue({ id: 's-1' });

            const assignment = await service.autoAssignSupport('s-1');
            expect(assignment.supportUserId).toBe('u-1');
        });
    });
});
