import { TenantService } from '../../../core/tenant/tenant.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAnalyticsService } from './ticket-analytics.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketMessage } from '../entities/ticket-message.entity';

describe('TicketAnalyticsService', () => {
    let service: TicketAnalyticsService;
    let ticketRepository: Repository<Ticket>;
    let messageRepository: Repository<TicketMessage>;

    const mockTickets: Partial<Ticket>[] = [
        {
            id: 'ticket-1', assignedToId: 'agent-1', categoryId: 'cat-1', tags: ['urgent'],
            status: TicketStatus.OPEN,
            priority: TicketPriority.HIGH,
            createdAt: new Date('2024-01-01'),
            resolvedAt: null,
            isSLABreached: false,
        },
        {
            id: 'ticket-2', assignedToId: 'agent-1', categoryId: 'cat-1', tags: ['urgent'],
            status: TicketStatus.RESOLVED,
            priority: TicketPriority.MEDIUM,
            createdAt: new Date('2024-01-02'),
            resolvedAt: new Date('2024-01-03'),
            isSLABreached: false,
        },
    ];

    const queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn(),
            getMany: jest.fn(),
    };
    const mockRepository = {
        find: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => queryBuilder),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                { provide: TenantService, useValue: { getTenantId: () => 'tenant-a' } },
                TicketAnalyticsService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(TicketMessage),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<TicketAnalyticsService>(TicketAnalyticsService);
        ticketRepository = module.get(getRepositoryToken(Ticket));
        messageRepository = module.get(getRepositoryToken(TicketMessage));

        jest.clearAllMocks();
        queryBuilder.getMany.mockResolvedValue(mockTickets);
        mockRepository.find.mockResolvedValue(mockTickets);
        queryBuilder.getRawMany.mockResolvedValue([]);
    });

    describe('getOverallStats', () => {
        it('should return overall ticket statistics', async () => {
            mockRepository.count.mockResolvedValue(100);
            mockRepository.find.mockResolvedValue(mockTickets);

            const result = await service.getOverallStats();

            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('byStatus');
            expect(result).toHaveProperty('byPriority');
            expect(result).toHaveProperty('avgResponseTime');
            expect(result).toHaveProperty('avgResolutionTime');
        });

        it('should calculate SLA compliance percentage', async () => {
            mockRepository.count.mockResolvedValue(100);
            mockRepository.find.mockResolvedValue(mockTickets);

            const result = await service.getOverallStats();

            expect(result.slaCompliance).toBeGreaterThanOrEqual(0);
            expect(result.slaCompliance).toBeLessThanOrEqual(100);
        });
    });

    describe('getTimeBasedStats', () => {
        it('should return daily statistics', async () => {
            mockRepository.find.mockResolvedValue(mockTickets);

            const result = await service.getTimeBasedStats('day');

            expect(result).toHaveProperty('createdTickets');
            expect(result).toHaveProperty('resolvedTickets');
            expect(result).toHaveProperty('avgResponseTime');
            expect(result).toHaveProperty('slaBreaches');
        });

        it('should return weekly statistics', async () => {
            mockRepository.find.mockResolvedValue(mockTickets);

            const result = await service.getTimeBasedStats('week');

            expect(result.createdTickets).toBeInstanceOf(Array);
        });

        it('should return monthly statistics', async () => {
            mockRepository.find.mockResolvedValue(mockTickets);

            const result = await service.getTimeBasedStats('month');

            expect(result.resolvedTickets).toBeInstanceOf(Array);
        });
    });

    describe('getAgentPerformance', () => {
        it('should return performance stats for all agents', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
                {
                    agentId: 'agent-1',
                    agentName: 'John Doe',
                    assignedTickets: 50,
                    resolvedTickets: 45,
                    avgResponseTime: 2.5,
                    avgResolutionTime: 24,
                },
            ]);

            const result = await service.getAgentPerformance();

            expect(result).toBeInstanceOf(Array);
            expect(result[0]).toHaveProperty('agentId');
            expect(result[0]).toHaveProperty('assignedTickets');
            expect(result[0]).toHaveProperty('resolvedTickets');
        });

        it('should return performance stats for specific agent', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
                {
                    agentId: 'agent-1',
                    assignedTickets: 50,
                },
            ]);

            const result = await service.getAgentPerformance('agent-1');

            expect(result).toHaveLength(1);
        });
    });

    describe('getCategoryStats', () => {
        it('should return statistics by category', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
                {
                    categoryId: 'cat-1',
                    categoryName: 'Technical Support',
                    totalTickets: 100,
                    openTickets: 20,
                    resolvedTickets: 80,
                },
            ]);

            const result = await service.getCategoryStats();

            expect(result).toBeInstanceOf(Array);
            expect(result[0]).toHaveProperty('categoryId');
            expect(result[0]).toHaveProperty('totalTickets');
        });
    });

    describe('getTagStats', () => {
        it('should return statistics by tag', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
                {
                    tag: 'urgent',
                    count: 25,
                    avgResolutionTime: 12,
                },
            ]);

            const result = await service.getTagStats();

            expect(result).toBeInstanceOf(Array);
            expect(result[0]).toHaveProperty('tag');
            expect(result[0]).toHaveProperty('count');
        });
    });

    describe('getCustomerStats', () => {
        it('should return customer statistics', async () => {
            mockRepository.count
                .mockResolvedValueOnce(50) // total
                .mockResolvedValueOnce(10) // open
                .mockResolvedValueOnce(40); // resolved

            mockRepository.find.mockResolvedValue(mockTickets);

            const result = await service.getCustomerStats('user-123');

            expect(result).toHaveProperty('totalTickets');
            expect(result).toHaveProperty('openTickets');
            expect(result).toHaveProperty('resolvedTickets');
            expect(result).toHaveProperty('mostUsedCategories');
            expect(result).toHaveProperty('mostUsedTags');
        });
    });
});
