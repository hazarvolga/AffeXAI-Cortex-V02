import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportDashboardService } from './support-dashboard.service';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSupportAssignment } from '../entities/chat-support-assignment.entity';
import { User } from '../../users/entities/user.entity';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';

describe('SupportDashboardService', () => {
    let service: SupportDashboardService;

    const mockRepo = {
        createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getRawOne: jest.fn(),
            getRawMany: jest.fn(),
            getCount: jest.fn(),
            getMany: jest.fn(),
        })),
        count: jest.fn(),
        find: jest.fn(),
    };

    const mockAssignmentService = {
        getAssignmentStats: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupportDashboardService,
                { provide: getRepositoryToken(ChatSession), useValue: mockRepo },
                { provide: getRepositoryToken(ChatMessage), useValue: mockRepo },
                { provide: getRepositoryToken(ChatSupportAssignment), useValue: mockRepo },
                { provide: getRepositoryToken(User), useValue: mockRepo },
                { provide: ChatSupportAssignmentService, useValue: mockAssignmentService },
            ],
        }).compile();

        service = module.get<SupportDashboardService>(SupportDashboardService);

        jest.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should aggregate core metrics', async () => {
            mockRepo.createQueryBuilder().getRawOne.mockResolvedValue({ avg: 100 });
            mockRepo.count.mockResolvedValue(50);

            const stats = await service.getDashboardStats();

            expect(stats.activeSessions).toBeDefined();
            expect(stats.avgResponseTime).toBeDefined();
        });
    });

    describe('getSupportAgentStats', () => {
        it('should return agent performance data', async () => {
            mockRepo.find.mockResolvedValue([{ id: 'u-1', email: 'a@b.c' }]);
            mockRepo.createQueryBuilder().getRawMany.mockResolvedValue([]);

            const stats = await service.getSupportAgentStats();

            expect(stats.length).toBeGreaterThan(0);
        });
    });

    describe('getRealTimeMetrics', () => {
        it('should return live queue data', async () => {
            mockRepo.count.mockResolvedValue(5);

            const metrics = await service.getRealTimeMetrics();

            expect(metrics.queueLength).toBe(5);
        });
    });

    describe('determineSessionUrgency', () => {
        it('should mark long waiting sessions as critical', () => {
            const urgency = service.determineSessionUrgency({} as any, 30 * 60 * 1000); // 30 mins
            expect(urgency).toBe('critical'); // Assuming threshold logic
        });
    });
});
