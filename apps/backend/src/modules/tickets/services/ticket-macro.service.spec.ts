import { TenantService } from '../../../core/tenant/tenant.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TicketMacroService } from './ticket-macro.service';
import { TicketMacro, MacroAction } from '../entities/ticket-macro.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketMessage } from '../entities/ticket-message.entity';
import { TicketsService } from '../tickets.service';

describe('TicketMacroService', () => {
    let service: TicketMacroService;
    let macroRepository: Repository<TicketMacro>;
    let ticketRepository: Repository<Ticket>;
    let messageRepository: Repository<TicketMessage>;
    let ticketsService: TicketsService;

    let mockMacro: Partial<TicketMacro> = {
        id: 'macro-123',
        name: 'Close and Tag',
        description: 'Close ticket and add resolved tag',
        actions: [
            { type: 'update_status', value: TicketStatus.CLOSED },
            { type: 'add_tag', value: 'resolved' },
        ],
        isActive: true,
        isPublic: true,
        usageCount: 0,
        createdById: 'user-123',
    };

    let mockTicket: Partial<Ticket> = {
        id: 'ticket-123',
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        tags: [],
    };

    const queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
    };
    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => queryBuilder),
    };

    const mockTicketsService = {
        updateStatus: jest.fn(),
        assignTo: jest.fn(),
        addMessage: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                { provide: TenantService, useValue: { getTenantId: () => 'fixture-tenant' } },
                TicketMacroService,
                {
                    provide: getRepositoryToken(TicketMacro),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(TicketMessage),
                    useValue: mockRepository,
                },
                {
                    provide: TicketsService,
                    useValue: mockTicketsService,
                },
            ],
        }).compile();

        service = module.get<TicketMacroService>(TicketMacroService);
        macroRepository = module.get(getRepositoryToken(TicketMacro));
        ticketRepository = module.get(getRepositoryToken(Ticket));
        messageRepository = module.get(getRepositoryToken(TicketMessage));
        ticketsService = module.get<TicketsService>(TicketsService);

        jest.clearAllMocks();
        mockMacro = { ...mockMacro, name: 'Close and Tag', usageCount: 0 };
        mockTicket = { ...mockTicket, tags: [] };
        mockTicketsService.updateStatus.mockReset();
    });

    describe('createMacro', () => {
        it('should create a new macro', async () => {
            const createDto = {
                name: 'Test Macro',
                description: 'Test Description',
                actions: [{ type: 'update_status', value: TicketStatus.CLOSED }] as MacroAction[],
                isPublic: true,
            };

            mockRepository.create.mockReturnValue(mockMacro);
            mockRepository.save.mockResolvedValue(mockMacro);

            const result = await service.createMacro('user-123', createDto);

            expect(mockRepository.create).toHaveBeenCalledWith({
                ...createDto,
                createdById: 'user-123',
                tenantId: 'fixture-tenant',
            });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockMacro);
        });
    });

    describe('updateMacro', () => {
        it('should update an existing macro', async () => {
            const updates = { name: 'Updated Macro' };
            mockRepository.findOne.mockResolvedValue(mockMacro);
            mockRepository.save.mockResolvedValue({ ...mockMacro, ...updates });

            const result = await service.updateMacro('macro-123', updates);

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'macro-123', tenantId: 'fixture-tenant' } });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.name).toBe('Updated Macro');
        });

        it('should throw NotFoundException if macro not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.updateMacro('non-existent', {})).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('deleteMacro', () => {
        it('should delete a macro', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await service.deleteMacro('macro-123');

            expect(mockRepository.delete).toHaveBeenCalledWith({ id: 'macro-123', tenantId: 'fixture-tenant' });
        });

        it('should throw NotFoundException if macro not found', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.deleteMacro('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getMacro', () => {
        it('should return a macro by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockMacro);

            const result = await service.getMacro('macro-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'macro-123', tenantId: 'fixture-tenant' },
                relations: ['createdBy'],
            });
            expect(result).toEqual(mockMacro);
        });

        it('should throw NotFoundException if macro not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.getMacro('non-existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getAllMacros', () => {
        it('should return public macros for unauthenticated users', async () => {
            mockRepository.createQueryBuilder().getMany.mockResolvedValue([mockMacro]);

            const result = await service.getAllMacros();

            expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
            expect(result).toEqual([mockMacro]);
        });

        it('should return public and user macros for authenticated users', async () => {
            mockRepository.createQueryBuilder().getMany.mockResolvedValue([mockMacro]);

            const result = await service.getAllMacros('user-123');

            expect(mockRepository.createQueryBuilder().andWhere).toHaveBeenCalled();
            expect(result).toEqual([mockMacro]);
        });
    });

    describe('executeMacro', () => {
        it('should execute macro on tickets successfully', async () => {
            mockRepository.findOne.mockResolvedValue(mockMacro);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockRepository.save.mockResolvedValue({ ...mockMacro, usageCount: 1 });
            mockTicketsService.updateStatus.mockResolvedValue(mockTicket);

            const result = await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(result.success).toBe(true);
            expect(result.ticketsAffected).toBe(1);
            expect(result.errors).toHaveLength(0);
            expect(mockMacro.usageCount).toBe(0); // Original unchanged
        });

        it('should handle errors gracefully', async () => {
            mockRepository.findOne.mockResolvedValue(mockMacro);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockTicketsService.updateStatus.mockRejectedValue(new Error('Update failed'));
            mockRepository.save.mockResolvedValue(mockMacro);

            const result = await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(result.success).toBe(false);
            expect(result.ticketsAffected).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should throw NotFoundException if no tickets found', async () => {
            mockRepository.findOne.mockResolvedValue(mockMacro);
            mockRepository.find.mockResolvedValue([]);

            await expect(
                service.executeMacro('macro-123', ['non-existent'], 'user-123'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should increment usage count', async () => {
            mockRepository.findOne.mockResolvedValue(mockMacro);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockRepository.save.mockResolvedValue({ ...mockMacro, usageCount: 1 });

            await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ usageCount: 1 }),
            );
        });
    });

    it('changes tag columns without resaving stale ticket status after a status action', async () => {
      mockRepository.findOne.mockResolvedValue(mockMacro);
      mockRepository.find.mockResolvedValue([mockTicket]);
      await service.executeMacro('macro-123', ['ticket-123'], 'user-123');
      expect(mockRepository.find).toHaveBeenCalledWith(expect.objectContaining({ relations: ['user', 'assignedTo'] }));
      expect(mockRepository.update).toHaveBeenCalledWith({ id: 'ticket-123', tenantId: 'fixture-tenant' }, { tags: ['resolved'] });
      expect(mockRepository.save).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'ticket-123', status: TicketStatus.OPEN }));
    });

    describe('macro actions', () => {
        it('should execute update_status action', async () => {
            const actions: MacroAction[] = [
                { type: 'update_status', value: TicketStatus.CLOSED },
            ];

            mockRepository.findOne.mockResolvedValue(mockMacro);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockTicketsService.updateStatus.mockResolvedValue(mockTicket);
            mockRepository.save.mockResolvedValue(mockMacro);

            await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(mockTicketsService.updateStatus).toHaveBeenCalledWith(
                'ticket-123',
                TicketStatus.CLOSED,
                'user-123',
            );
        });

        it('should execute assign action', async () => {
            const macroWithAssign = {
                ...mockMacro,
                actions: [{ type: 'assign', value: 'agent-123' }] as MacroAction[],
            };

            mockRepository.findOne.mockResolvedValue(macroWithAssign);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockTicketsService.assignTo.mockResolvedValue(mockTicket);
            mockRepository.save.mockResolvedValue(macroWithAssign);

            await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(mockTicketsService.assignTo).toHaveBeenCalledWith(
                'ticket-123',
                'agent-123',
                'user-123',
            );
        });

        it('should execute add_tag action', async () => {
            const macroWithTag = {
                ...mockMacro,
                actions: [{ type: 'add_tag', value: 'urgent' }] as MacroAction[],
            };

            mockRepository.findOne.mockResolvedValue(macroWithTag);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockRepository.save.mockResolvedValue(mockTicket);

            await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should execute add_note action', async () => {
            const macroWithNote = {
                ...mockMacro,
                actions: [{ type: 'add_note', value: 'Internal note' }] as MacroAction[],
            };

            mockRepository.findOne.mockResolvedValue(macroWithNote);
            mockRepository.find.mockResolvedValue([mockTicket]);
            mockTicketsService.addMessage.mockResolvedValue({});
            mockRepository.save.mockResolvedValue(macroWithNote);

            await service.executeMacro('macro-123', ['ticket-123'], 'user-123');

            expect(mockTicketsService.addMessage).toHaveBeenCalledWith(
                'ticket-123',
                'user-123',
                {
                    content: 'Internal note',
                    isInternal: true,
                },
            );
        });
    });

    describe('getPopularMacros', () => {
        it('should return popular macros', async () => {
            const popularMacros = [
                { ...mockMacro, usageCount: 100 },
                { ...mockMacro, id: 'macro-456', usageCount: 50 },
            ];

            mockRepository.find.mockResolvedValue(popularMacros);

            const result = await service.getPopularMacros(10);

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { isActive: true, isPublic: true, tenantId: 'fixture-tenant' },
                relations: ['createdBy'],
                order: { usageCount: 'DESC' },
                take: 10,
            });
            expect(result).toEqual(popularMacros);
        });
    });

    describe('getStatistics', () => {
        it('should return macro statistics', async () => {
            mockRepository.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(80) // active
                .mockResolvedValueOnce(60); // public

            mockRepository.find.mockResolvedValue([
                { usageCount: 10 },
                { usageCount: 20 },
                { usageCount: 30 },
            ]);

            const result = await service.getStatistics();

            expect(result.total).toBe(100);
            expect(result.active).toBe(80);
            expect(result.public).toBe(60);
            expect(result.totalUsage).toBe(60); // 10 + 20 + 30
        });
    });
});
