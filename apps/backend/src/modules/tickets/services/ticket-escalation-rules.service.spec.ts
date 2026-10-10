import { TenantService } from '../../../core/tenant/tenant.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEscalationRulesService } from './ticket-escalation-rules.service';
import { TicketEscalationRule } from '../entities/ticket-escalation-rule.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

describe('TicketEscalationRulesService', () => {
    let service: TicketEscalationRulesService;
    let repository: Repository<TicketEscalationRule>;

    const mockRule: Partial<TicketEscalationRule> = {
        id: 'rule-123',
        name: 'SLA Breach Escalation',
        description: 'Escalate when SLA is breached',
        isActive: true,
        priority: 10,
        maxApplications: 3,
        actions: { assignToId: 'manager-123' },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockTicket: Partial<Ticket> = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        escalationHistory: [],
        isSLABreached: true,
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
                TicketEscalationRulesService,
                {
                    provide: getRepositoryToken(TicketEscalationRule),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<TicketEscalationRulesService>(TicketEscalationRulesService);
        repository = module.get(getRepositoryToken(TicketEscalationRule));

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getActiveRules', () => {
        it('should return active rules ordered by priority descending', async () => {
            const rules = [
                { ...mockRule, priority: 10 },
                { ...mockRule, id: 'rule-456', priority: 5 },
            ];

            mockRepository.find.mockResolvedValue(rules);

            const result = await service.getActiveRules();

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { isActive: true, tenantId: 'tenant-a' },
                order: { priority: 'DESC' },
            });
            expect(result).toEqual(rules);
            expect(result).toHaveLength(2);
        });

        it('should return empty array if no active rules', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await service.getActiveRules();

            expect(result).toEqual([]);
        });

        it('should only return active rules, not inactive ones', async () => {
            mockRepository.find.mockResolvedValue([mockRule]);

            await service.getActiveRules();

            expect(mockRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true, tenantId: 'tenant-a' },
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a rule by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockRule);

            const result = await service.findOne('rule-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'rule-123', tenantId: 'tenant-a' } });
            expect(result).toEqual(mockRule);
        });

        it('should throw error if rule not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(
                'Ticket escalation rule not found: non-existent',
            );
        });

        it('should throw error with correct rule id in message', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('specific-id-123')).rejects.toThrow(
                'specific-id-123',
            );
        });
    });

    describe('create', () => {
        it('should create a new escalation rule', async () => {
            const createData = {
                name: 'New Rule',
                description: 'Test rule',
                priority: 5,
                maxApplications: 2,
            };

            mockRepository.create.mockReturnValue(mockRule);
            mockRepository.save.mockResolvedValue(mockRule);

            const result = await service.create(createData);

            expect(mockRepository.create).toHaveBeenCalledWith({ ...createData, tenantId: 'tenant-a' });
            expect(mockRepository.save).toHaveBeenCalledWith(mockRule);
            expect(result).toEqual(mockRule);
        });

        it('should create rule with all provided fields', async () => {
            const fullData: Partial<TicketEscalationRule> = {
                name: 'Full Rule',
                description: 'Complete rule',
                isActive: true,
                priority: 10,
                maxApplications: 5,
                actions: { assignToId: 'manager-456' },
            };

            mockRepository.create.mockReturnValue(fullData);
            mockRepository.save.mockResolvedValue(fullData);

            const result = await service.create(fullData);

            expect(result).toMatchObject(fullData);
        });
    });

    describe('update', () => {
        it('should update an existing rule', async () => {
            const updates = { name: 'Updated Rule', priority: 15 };
            const updatedRule = { ...mockRule, ...updates };

            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOne.mockResolvedValue(updatedRule);

            const result = await service.update('rule-123', updates);

            expect(mockRepository.update).toHaveBeenCalledWith({ id: 'rule-123', tenantId: 'tenant-a' }, updates);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'rule-123', tenantId: 'tenant-a' } });
            expect(result).toEqual(updatedRule);
        });

        it('should throw error if rule not found after update', async () => {
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.update('non-existent', {})).rejects.toThrow(
                'Ticket escalation rule not found: non-existent',
            );
        });

        it('should handle partial updates correctly', async () => {
            const partialUpdate = { priority: 20 };
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOne.mockResolvedValue({ ...mockRule, priority: 20 });

            const result = await service.update('rule-123', partialUpdate);

            expect(result.priority).toBe(20);
            expect(result.name).toBe(mockRule.name); // Other fields unchanged
        });
    });

    describe('delete', () => {
        it('should delete a rule', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await service.delete('rule-123');

            expect(mockRepository.delete).toHaveBeenCalledWith({ id: 'rule-123', tenantId: 'tenant-a' });
        });

        it('should not throw error even if rule does not exist', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.delete('non-existent')).resolves.not.toThrow();
        });
    });

    describe('toggle', () => {
        it('should toggle rule from active to inactive', async () => {
            const activeRule = { ...mockRule, isActive: true };
            mockRepository.findOne.mockResolvedValue(activeRule);
            mockRepository.save.mockResolvedValue({ ...activeRule, isActive: false });

            const result = await service.toggle('rule-123');

            expect(result.isActive).toBe(false);
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: false }),
            );
        });

        it('should toggle rule from inactive to active', async () => {
            const inactiveRule = { ...mockRule, isActive: false };
            mockRepository.findOne.mockResolvedValue(inactiveRule);
            mockRepository.save.mockResolvedValue({ ...inactiveRule, isActive: true });

            const result = await service.toggle('rule-123');

            expect(result.isActive).toBe(true);
        });

        it('should throw error if rule not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.toggle('non-existent')).rejects.toThrow(
                'Rule not found: non-existent',
            );
        });
    });

    describe('findAll', () => {
        it('should return all rules ordered by creation date', async () => {
            const rules = [mockRule, { ...mockRule, id: 'rule-456' }];
            mockRepository.find.mockResolvedValue(rules);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-a' },
                order: { createdAt: 'DESC' },
            });
            expect(result).toEqual(rules);
        });

        it('should return empty array if no rules exist', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('hasReachedMaxApplications', () => {
        it('should return false if no escalation history', () => {
            const ticket = { ...mockTicket, escalationHistory: null };

            const result = service.hasReachedMaxApplications(mockRule as TicketEscalationRule, ticket as Ticket);

            expect(result).toBe(false);
        });

        it('should return false if empty escalation history', () => {
            const ticket = { ...mockTicket, escalationHistory: [] };

            const result = service.hasReachedMaxApplications(mockRule as TicketEscalationRule, ticket as Ticket);

            expect(result).toBe(false);
        });

        it('should return false if applications below max', () => {
            const ticket = {
                ...mockTicket,
                escalationHistory: [
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                ],
            };

            const result = service.hasReachedMaxApplications(
                { ...mockRule, maxApplications: 3 } as TicketEscalationRule,
                ticket as Ticket,
            );

            expect(result).toBe(false);
        });

        it('should return true if applications equal max', () => {
            const ticket = {
                ...mockTicket,
                escalationHistory: [
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                ],
            };

            const result = service.hasReachedMaxApplications(
                { ...mockRule, maxApplications: 3 } as TicketEscalationRule,
                ticket as Ticket,
            );

            expect(result).toBe(true);
        });

        it('should return true if applications exceed max', () => {
            const ticket = {
                ...mockTicket,
                escalationHistory: [
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                ],
            };

            const result = service.hasReachedMaxApplications(
                { ...mockRule, maxApplications: 3 } as TicketEscalationRule,
                ticket as Ticket,
            );

            expect(result).toBe(true);
        });

        it('should only count applications for the specific rule', () => {
            const ticket = {
                ...mockTicket,
                escalationHistory: [
                    { ruleId: 'rule-123', escalatedAt: new Date() },
                    { ruleId: 'other-rule', escalatedAt: new Date() },
                    { ruleId: 'another-rule', escalatedAt: new Date() },
                ],
            };

            const result = service.hasReachedMaxApplications(
                { ...mockRule, maxApplications: 3 } as TicketEscalationRule,
                ticket as Ticket,
            );

            expect(result).toBe(false); // Only 1 application of rule-123
        });
    });
});
