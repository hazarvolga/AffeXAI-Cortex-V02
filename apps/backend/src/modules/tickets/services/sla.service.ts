import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { BusinessHoursService } from './business-hours.service';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * SLA Service
 * Handles all SLA-related calculations and tracking
 */
@Injectable()
export class SlaService {
  // Default SLA times in hours by priority
  private readonly DEFAULT_SLA_CONFIG = {
    [TicketPriority.URGENT]: {
      firstResponse: 1, // 1 hour
      resolution: 4, // 4 hours
    },
    [TicketPriority.HIGH]: {
      firstResponse: 4, // 4 hours
      resolution: 24, // 1 day
    },
    [TicketPriority.MEDIUM]: {
      firstResponse: 8, // 8 hours
      resolution: 72, // 3 days
    },
    [TicketPriority.LOW]: {
      firstResponse: 24, // 1 day
      resolution: 168, // 1 week
    },
  };

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly businessHoursService: BusinessHoursService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }

  /**
   * Calculate and set SLA due dates for a ticket based on priority
   */
  calculateSLADueDates(ticket: Ticket): {
    slaFirstResponseDueAt: Date;
    slaResolutionDueAt: Date;
  } {
    const config = this.DEFAULT_SLA_CONFIG[ticket.priority];
    const createdAt = ticket.createdAt || new Date();

    return {
      slaFirstResponseDueAt: this.businessHoursService.calculateSLADueDate(
        createdAt,
        config.firstResponse,
        true, // Use business hours
      ),
      slaResolutionDueAt: this.businessHoursService.calculateSLADueDate(
        createdAt,
        config.resolution,
        true, // Use business hours
      ),
    };
  }

  /**
   * Check if SLA is breached for a ticket
   */
  checkSLABreach(ticket: Ticket): boolean {
    const now = new Date();

    // Check first response SLA
    if (!ticket.firstResponseAt && ticket.slaFirstResponseDueAt) {
      if (now > ticket.slaFirstResponseDueAt) {
        return true;
      }
    }

    // Check resolution SLA
    if (!ticket.resolvedAt && ticket.slaResolutionDueAt) {
      if (now > ticket.slaResolutionDueAt) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate response time in hours
   */
  calculateResponseTime(ticket: Ticket): number {
    if (!ticket.firstResponseAt) {
      return 0;
    }

    const createdAt = ticket.createdAt || new Date();
    const diffMs = ticket.firstResponseAt.getTime() - createdAt.getTime();
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate resolution time in hours
   */
  calculateResolutionTime(ticket: Ticket): number {
    if (!ticket.resolvedAt) {
      return 0;
    }

    const createdAt = ticket.createdAt || new Date();
    const diffMs = ticket.resolvedAt.getTime() - createdAt.getTime();
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Check if a date is within business hours
   */
  isWithinBusinessHours(date: Date): boolean {
    return this.businessHoursService.isBusinessHours(date);
  }

  /**
   * Get SLA status for a ticket
   */
  getSLAStatus(ticket: Ticket): {
    firstResponse: {
      isDue: boolean;
      isBreached: boolean;
      remainingHours: number;
    };
    resolution: {
      isDue: boolean;
      isBreached: boolean;
      remainingHours: number;
    };
  } {
    const now = new Date();

    const firstResponse = {
      isDue: !!ticket.slaFirstResponseDueAt && !ticket.firstResponseAt,
      isBreached:
        !!ticket.slaFirstResponseDueAt &&
        !ticket.firstResponseAt &&
        now > ticket.slaFirstResponseDueAt,
      remainingHours: ticket.slaFirstResponseDueAt
        ? Math.max(
          0,
          Math.round(
            (ticket.slaFirstResponseDueAt.getTime() - now.getTime()) /
            (1000 * 60 * 60),
          ),
        )
        : 0,
    };

    const resolution = {
      isDue: !!ticket.slaResolutionDueAt && !ticket.resolvedAt,
      isBreached:
        !!ticket.slaResolutionDueAt &&
        !ticket.resolvedAt &&
        now > ticket.slaResolutionDueAt,
      remainingHours: ticket.slaResolutionDueAt
        ? Math.max(
          0,
          Math.round(
            (ticket.slaResolutionDueAt.getTime() - now.getTime()) /
            (1000 * 60 * 60),
          ),
        )
        : 0,
    };

    return { firstResponse, resolution };
  }

  /**
   * Update ticket with SLA calculations
   */
  async updateTicketSLA(ticketId: string): Promise<Ticket> {
    const tenantId = this.getActiveTenantId();
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    // Calculate SLA due dates if not set
    if (!ticket.slaFirstResponseDueAt || !ticket.slaResolutionDueAt) {
      const slaDates = this.calculateSLADueDates(ticket);
      ticket.slaFirstResponseDueAt = slaDates.slaFirstResponseDueAt;
      ticket.slaResolutionDueAt = slaDates.slaResolutionDueAt;
    }

    // Update SLA breach status
    ticket.isSLABreached = this.checkSLABreach(ticket);

    // Update response and resolution times
    ticket.responseTimeHours = this.calculateResponseTime(ticket);
    ticket.resolutionTimeHours = this.calculateResolutionTime(ticket);

    return await this.ticketRepository.save(ticket);
  }

  /**
   * Get tickets approaching SLA breach (within threshold hours)
   */
  async getTicketsApproachingSLABreach(
    thresholdHours: number = 2,
  ): Promise<Ticket[]> {
    const tenantId = this.getActiveTenantId();
    const tickets = await this.ticketRepository.find({
      where: [
        { status: TicketStatus.NEW, tenantId },
        { status: TicketStatus.OPEN, tenantId },
        { status: TicketStatus.PENDING_CUSTOMER, tenantId },
      ],
    });

    const now = new Date();
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    return tickets.filter((ticket) => {
      // Check first response SLA
      if (!ticket.firstResponseAt && ticket.slaFirstResponseDueAt) {
        const timeToBreachMs =
          ticket.slaFirstResponseDueAt.getTime() - now.getTime();
        if (timeToBreachMs > 0 && timeToBreachMs <= thresholdMs) {
          return true;
        }
      }

      // Check resolution SLA
      if (!ticket.resolvedAt && ticket.slaResolutionDueAt) {
        const timeToBreachMs =
          ticket.slaResolutionDueAt.getTime() - now.getTime();
        if (timeToBreachMs > 0 && timeToBreachMs <= thresholdMs) {
          return true;
        }
      }

      return false;
    });
  }
}
