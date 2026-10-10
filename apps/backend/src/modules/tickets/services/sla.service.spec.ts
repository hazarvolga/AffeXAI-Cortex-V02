import { TenantService } from '../../../core/tenant/tenant.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlaService } from './sla.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { BusinessHoursService } from './business-hours.service';

describe('SlaService', () => {
    let service: SlaService;
    let ticketRepository: Repository<Ticket>;
    let businessHoursService: BusinessHoursService;

    const mockTicket: Partial<Ticket> = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        createdAt: new Date('2024-01-01T09:00:00Z'),
        firstResponseAt: null,
        resolvedAt: null,
        slaFirstResponseDueAt: new Date('2024-01-01T13:00:00Z'), // 4 hours later
        slaResolutionDueAt: new Date('2024-01-02T09:00:00Z'), // 24 hours later
    };

    const mockRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
    };

    const mockBusinessHoursService = {
        calculateSLADueDate: jest.fn(),
        isBusinessHours: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                { provide: TenantService, useValue: { getTenantId: () => 'tenant-a' } },
                SlaService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: mockRepository,
                },
                {
                    provide: BusinessHoursService,
                    useValue: mockBusinessHoursService,
                },
            ],
        }).compile();

        service = module.get<SlaService>(SlaService);
        ticketRepository = module.get(getRepositoryToken(Ticket));
        businessHoursService = module.get<BusinessHoursService>(BusinessHoursService);

        jest.clearAllMocks();
    });

    describe('calculateSLADueDates', () => {
        it('should calculate SLA due dates for URGENT priority', () => {
            const urgentTicket = { ...mockTicket, priority: TicketPriority.URGENT };
            const firstResponseDue = new Date('2024-01-01T10:00:00Z');
            const resolutionDue = new Date('2024-01-01T13:00:00Z');

            mockBusinessHoursService.calculateSLADueDate
                .mockReturnValueOnce(firstResponseDue)
                .mockReturnValueOnce(resolutionDue);

            const result = service.calculateSLADueDates(urgentTicket as Ticket);

            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledTimes(2);
            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                urgentTicket.createdAt,
                1, // 1 hour for urgent first response
                true,
            );
            expect(result.slaFirstResponseDueAt).toEqual(firstResponseDue);
            expect(result.slaResolutionDueAt).toEqual(resolutionDue);
        });

        it('should calculate SLA due dates for HIGH priority', () => {
            mockBusinessHoursService.calculateSLADueDate
                .mockReturnValueOnce(new Date())
                .mockReturnValueOnce(new Date());

            const result = service.calculateSLADueDates(mockTicket as Ticket);

            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                mockTicket.createdAt,
                4, // 4 hours for high first response
                true,
            );
            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                mockTicket.createdAt,
                24, // 24 hours for high resolution
                true,
            );
        });

        it('should calculate SLA due dates for MEDIUM priority', () => {
            const mediumTicket = { ...mockTicket, priority: TicketPriority.MEDIUM };
            mockBusinessHoursService.calculateSLADueDate
                .mockReturnValueOnce(new Date())
                .mockReturnValueOnce(new Date());

            service.calculateSLADueDates(mediumTicket as Ticket);

            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                mediumTicket.createdAt,
                8, // 8 hours for medium first response
                true,
            );
            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                mediumTicket.createdAt,
                72, // 72 hours for medium resolution
                true,
            );
        });

        it('should calculate SLA due dates for LOW priority', () => {
            const lowTicket = { ...mockTicket, priority: TicketPriority.LOW };
            mockBusinessHoursService.calculateSLADueDate
                .mockReturnValueOnce(new Date())
                .mockReturnValueOnce(new Date());

            service.calculateSLADueDates(lowTicket as Ticket);

            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                lowTicket.createdAt,
                24, // 24 hours for low first response
                true,
            );
            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledWith(
                lowTicket.createdAt,
                168, // 168 hours (1 week) for low resolution
                true,
            );
        });
    });

    describe('checkSLABreach', () => {
        it('should return false if no SLA breach', () => {
            const ticket = {
                ...mockTicket,
                slaFirstResponseDueAt: new Date(Date.now() + 3600000), // 1 hour in future
                slaResolutionDueAt: new Date(Date.now() + 86400000), // 1 day in future
            };

            const result = service.checkSLABreach(ticket as Ticket);

            expect(result).toBe(false);
        });

        it('should return true if first response SLA breached', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: null,
                slaFirstResponseDueAt: new Date(Date.now() - 3600000), // 1 hour in past
            };

            const result = service.checkSLABreach(ticket as Ticket);

            expect(result).toBe(true);
        });

        it('should return true if resolution SLA breached', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: new Date(),
                resolvedAt: null,
                slaResolutionDueAt: new Date(Date.now() - 3600000), // 1 hour in past
            };

            const result = service.checkSLABreach(ticket as Ticket);

            expect(result).toBe(true);
        });

        it('should return false if ticket already responded', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: new Date(),
                slaResolutionDueAt: new Date(Date.now() + 86400000),
                slaFirstResponseDueAt: new Date(Date.now() - 3600000), // Past due but already responded
            };

            const result = service.checkSLABreach(ticket as Ticket);

            expect(result).toBe(false);
        });

        it('should return false if ticket already resolved', () => {
            const ticket = {
                ...mockTicket,
                resolvedAt: new Date(),
                firstResponseAt: new Date(),
                slaResolutionDueAt: new Date(Date.now() - 3600000), // Past due but already resolved
            };

            const result = service.checkSLABreach(ticket as Ticket);

            expect(result).toBe(false);
        });
    });

    describe('calculateResponseTime', () => {
        it('should calculate response time in hours', () => {
            const ticket = {
                ...mockTicket,
                createdAt: new Date('2024-01-01T09:00:00Z'),
                firstResponseAt: new Date('2024-01-01T12:30:00Z'),
            };

            const result = service.calculateResponseTime(ticket as Ticket);

            expect(result).toBe(3.5); // 3.5 hours
        });

        it('should return 0 if no first response', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: null,
            };

            const result = service.calculateResponseTime(ticket as Ticket);

            expect(result).toBe(0);
        });

        it('should round to 1 decimal place', () => {
            const ticket = {
                ...mockTicket,
                createdAt: new Date('2024-01-01T09:00:00Z'),
                firstResponseAt: new Date('2024-01-01T09:20:00Z'),
            };

            const result = service.calculateResponseTime(ticket as Ticket);

            expect(result).toBe(0.3); // 0.33 rounded to 0.3
        });
    });

    describe('calculateResolutionTime', () => {
        it('should calculate resolution time in hours', () => {
            const ticket = {
                ...mockTicket,
                createdAt: new Date('2024-01-01T09:00:00Z'),
                resolvedAt: new Date('2024-01-02T09:00:00Z'),
            };

            const result = service.calculateResolutionTime(ticket as Ticket);

            expect(result).toBe(24); // 24 hours
        });

        it('should return 0 if not resolved', () => {
            const ticket = {
                ...mockTicket,
                resolvedAt: null,
            };

            const result = service.calculateResolutionTime(ticket as Ticket);

            expect(result).toBe(0);
        });
    });

    describe('getSLAStatus', () => {
        it('should return correct SLA status for ticket approaching breach', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: null,
                resolvedAt: null,
                slaFirstResponseDueAt: new Date(Date.now() + 3600000), // 1 hour remaining
                slaResolutionDueAt: new Date(Date.now() + 7200000), // 2 hours remaining
            };

            const result = service.getSLAStatus(ticket as Ticket);

            expect(result.firstResponse.isDue).toBe(true);
            expect(result.firstResponse.isBreached).toBe(false);
            expect(result.firstResponse.remainingHours).toBeGreaterThan(0);
            expect(result.resolution.isDue).toBe(true);
            expect(result.resolution.isBreached).toBe(false);
        });

        it('should return breached status for overdue ticket', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: null,
                slaFirstResponseDueAt: new Date(Date.now() - 3600000), // 1 hour overdue
            };

            const result = service.getSLAStatus(ticket as Ticket);

            expect(result.firstResponse.isBreached).toBe(true);
            expect(result.firstResponse.remainingHours).toBe(0);
        });

        it('should return not due if already responded', () => {
            const ticket = {
                ...mockTicket,
                firstResponseAt: new Date(),
            };

            const result = service.getSLAStatus(ticket as Ticket);

            expect(result.firstResponse.isDue).toBe(false);
            expect(result.firstResponse.isBreached).toBe(false);
        });
    });

    describe('updateTicketSLA', () => {
        it('should update ticket with SLA calculations', async () => {
            mockRepository.findOne.mockResolvedValue(mockTicket);
            mockRepository.save.mockResolvedValue({
                ...mockTicket,
                isSLABreached: false,
                responseTimeHours: 0,
                resolutionTimeHours: 0,
            });

            const result = await service.updateTicketSLA('ticket-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'ticket-123', tenantId: 'tenant-a' } });
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toHaveProperty('isSLABreached');
        });

        it('should calculate SLA dates if not set', async () => {
            const ticketWithoutSLA = {
                ...mockTicket,
                slaFirstResponseDueAt: null,
                slaResolutionDueAt: null,
            };

            mockRepository.findOne.mockResolvedValue(ticketWithoutSLA);
            mockBusinessHoursService.calculateSLADueDate
                .mockReturnValueOnce(new Date())
                .mockReturnValueOnce(new Date());
            mockRepository.save.mockResolvedValue(ticketWithoutSLA);

            await service.updateTicketSLA('ticket-123');

            expect(mockBusinessHoursService.calculateSLADueDate).toHaveBeenCalledTimes(2);
        });

        it('should throw error if ticket not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.updateTicketSLA('non-existent')).rejects.toThrow(
                'Ticket non-existent not found',
            );
        });
    });

    describe('getTicketsApproachingSLABreach', () => {
        it('should return tickets approaching SLA breach', async () => {
            const approachingTicket = {
                ...mockTicket,
                firstResponseAt: null,
                slaFirstResponseDueAt: new Date(Date.now() + 3600000), // 1 hour remaining
            };

            mockRepository.find.mockResolvedValue([approachingTicket]);

            const result = await service.getTicketsApproachingSLABreach(2);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(approachingTicket);
        });

        it('should not return tickets with plenty of time', async () => {
            const safeTicket = {
                ...mockTicket,
                slaFirstResponseDueAt: new Date(Date.now() + 10800000), // 3 hours remaining
            };

            mockRepository.find.mockResolvedValue([safeTicket]);

            const result = await service.getTicketsApproachingSLABreach(2);

            expect(result).toHaveLength(0);
        });

        it('should not return already breached tickets', async () => {
            const breachedTicket = {
                ...mockTicket,
                firstResponseAt: null,
                slaFirstResponseDueAt: new Date(Date.now() - 3600000), // Already breached
            };

            mockRepository.find.mockResolvedValue([breachedTicket]);

            const result = await service.getTicketsApproachingSLABreach(2);

            expect(result).toHaveLength(0);
        });

        it('should filter by open ticket statuses', async () => {
            mockRepository.find.mockResolvedValue([]);

            await service.getTicketsApproachingSLABreach();

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: [
                    { status: TicketStatus.NEW, tenantId: 'tenant-a' },
                    { status: TicketStatus.OPEN, tenantId: 'tenant-a' },
                    { status: TicketStatus.PENDING_CUSTOMER, tenantId: 'tenant-a' },
                ],
            });
        });
    });

    describe('isWithinBusinessHours', () => {
        it('should delegate to business hours service', () => {
            const testDate = new Date();
            mockBusinessHoursService.isBusinessHours.mockReturnValue(true);

            const result = service.isWithinBusinessHours(testDate);

            expect(mockBusinessHoursService.isBusinessHours).toHaveBeenCalledWith(testDate);
            expect(result).toBe(true);
        });
    });
});
