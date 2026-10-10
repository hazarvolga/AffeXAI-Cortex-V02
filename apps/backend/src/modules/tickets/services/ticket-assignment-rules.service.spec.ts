import { TenantService } from '../../../core/tenant/tenant.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAssignmentRulesService } from './ticket-assignment-rules.service';
import { TicketAssignmentRule } from '../entities/ticket-assignment-rule.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

describe('TicketAssignmentRulesService', () => {
    let service: TicketAssignmentRulesService;
    let repository: Repository<TicketAssignmentRule>;

    const mockRule: Partial<TicketAssignmentRule> = {
        id: 'rule-123',
        name: 'High Priority Rule',
        isActive: true,
        priority: 10,
        assignToId: 'agent-123',
        skipIfAssigned: false,
        shouldTrigger: jest.fn().mockReturnValue(true),
    };

    const mockTicket: Partial<Ticket> = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        assignedToId: null,
    };

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                { provide: TenantService, useValue: { getTenantId: () => 'tenant-a' } },
                TicketAssignmentRulesService,
                {
                    provide: getRepositoryToken(TicketAssignmentRule),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<TicketAssignmentRulesService>(TicketAssignmentRulesService);
        repository = module.get(getRepositoryToken(TicketAssignmentRule));
        jest.clearAllMocks();
    });

    describe('getActiveRules', () => {
        it('should return active rules ordered by priority', async () => {
            mockRepository.find.mockResolvedValue([mockRule]);
            const result = await service.getActiveRules();
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { isActive: true, tenantId: 'tenant-a' },
                order: { priority: 'DESC' },
            });
            expect(result).toEqual([mockRule]);
        });
    });

    describe('findOne', () => {
        it('should return a rule by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockRule);
            const result = await service.findOne('rule-123');
            expect(result).toEqual(mockRule);
        });

        it('should throw error if rule not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.findOne('non-existent')).rejects.toThrow();
        });
    });

    describe('create', () => {
        it('should create a new rule', async () => {
            mockRepository.create.mockReturnValue(mockRule);
            mockRepository.save.mockResolvedValue(mockRule);
            const result = await service.create(mockRule);
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result).toEqual(mockRule);
        });
    });

    describe('update', () => {
        it('should update a rule', async () => {
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOne.mockResolvedValue(mockRule);
            const result = await service.update('rule-123', { name: 'Updated' });
            expect(mockRepository.update).toHaveBeenCalled();
            expect(result).toEqual(mockRule);
        });
    });

    describe('delete', () => {
        it('should delete a rule', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });
            await service.delete('rule-123');
            expect(mockRepository.delete).toHaveBeenCalledWith({ id: 'rule-123', tenantId: 'tenant-a' });
        });
    });

    describe('toggle', () => {
        it('should toggle rule active status', async () => {
            mockRepository.findOne.mockResolvedValue(mockRule);
            mockRepository.save.mockResolvedValue({ ...mockRule, isActive: false });
            const result = await service.toggle('rule-123');
            expect(result.isActive).toBe(false);
        });
    });

    describe('autoAssignTicket', () => {
        it('should assign ticket based on matching rule', async () => {
            mockRepository.find.mockResolvedValue([mockRule]);
            const result = await service.autoAssignTicket(mockTicket as Ticket);
            expect(result).toBe('agent-123');
        });

        it('should return null if no rule matches', async () => {
            const nonMatchingRule = { ...mockRule, shouldTrigger: jest.fn().mockReturnValue(false) };
            mockRepository.find.mockResolvedValue([nonMatchingRule]);
            const result = await service.autoAssignTicket(mockTicket as Ticket);
            expect(result).toBeNull();
        });

        it('should skip if ticket already assigned and rule configured to skip', async () => {
            const skipRule = { ...mockRule, skipIfAssigned: true };
            mockRepository.find.mockResolvedValue([skipRule]);
            const assignedTicket = { ...mockTicket, assignedToId: 'existing-agent' };
            const result = await service.autoAssignTicket(assignedTicket as Ticket);
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all rules', async () => {
            mockRepository.find.mockResolvedValue([mockRule]);
            const result = await service.findAll();
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-a' },
                order: { createdAt: 'DESC' },
            });
            expect(result).toEqual([mockRule]);
        });
    });
});
