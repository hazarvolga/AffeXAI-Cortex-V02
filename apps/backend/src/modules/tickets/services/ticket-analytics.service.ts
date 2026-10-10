import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Ticket Analytics Service
 * Provides comprehensive analytics and reporting for support tickets
 */
@Injectable()
export class TicketAnalyticsService {
  private readonly logger = new Logger(TicketAnalyticsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepository: Repository<TicketMessage>,
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
   * Get overall ticket statistics
   */
  async getOverallStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    avgResponseTime: number;
    avgResolutionTime: number;
    slaCompliance: number;
    satisfactionScore: number;
  }> {
    const tenantId = this.getActiveTenantId();
    const tickets = await this.ticketRepository.find({
      where: { tenantId }
    });

    const total = tickets.length;

    const byStatus = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const respondedTickets = tickets.filter(t => t.responseTimeHours > 0);
    const avgResponseTime = respondedTickets.length > 0
      ? respondedTickets.reduce((sum, t) => sum + t.responseTimeHours, 0) / respondedTickets.length
      : 0;

    const resolvedTickets = tickets.filter(t => t.resolutionTimeHours > 0);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + t.resolutionTimeHours, 0) / resolvedTickets.length
      : 0;

    const ticketsWithSLA = tickets.filter(t => t.slaResolutionDueAt);
    const slaCompliant = ticketsWithSLA.filter(t => !t.isSLABreached).length;
    const slaCompliance = ticketsWithSLA.length > 0
      ? (slaCompliant / ticketsWithSLA.length) * 100
      : 0;

    return {
      total,
      byStatus,
      byPriority,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      slaCompliance: Math.round(slaCompliance * 10) / 10,
      satisfactionScore: 0, // NOTE: CSAT tracking will be implemented with survey integration
    };
  }

  /**
   * Get time-based analytics (daily, weekly, monthly)
   */
  async getTimeBasedStats(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    createdTickets: Array<{ date: string; count: number }>;
    resolvedTickets: Array<{ date: string; count: number }>;
    avgResponseTime: Array<{ date: string; hours: number }>;
    slaBreaches: Array<{ date: string; count: number }>;
  }> {
    const now = new Date();
    const periodDays = period === 'day' ? 7 : period === 'week' ? 28 : 90;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const tenantId = this.getActiveTenantId();

    const tickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.tenantId = :tenantId', { tenantId })
      .andWhere('ticket.createdAt >= :startDate', { startDate })
      .getMany();

    const groupByDate = (items: Ticket[], dateField: 'createdAt' | 'resolvedAt') => {
      const grouped = new Map<string, Ticket[]>();

      items.forEach(item => {
        const date = item[dateField];
        if (date) {
          const key = date.toISOString().split('T')[0];
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push(item);
        }
      });

      return Array.from(grouped.entries()).map(([date, tickets]) => ({
        date,
        count: tickets.length,
      })).sort((a, b) => a.date.localeCompare(b.date));
    };

    const createdTickets = groupByDate(tickets, 'createdAt');
    const resolvedTickets = groupByDate(
      tickets.filter(t => t.resolvedAt),
      'resolvedAt'
    );

    const avgResponseTimeData = Array.from(
      tickets
        .filter(t => t.responseTimeHours > 0)
        .reduce((map, ticket) => {
          const key = ticket.createdAt.toISOString().split('T')[0];
          if (!map.has(key)) {
            map.set(key, []);
          }
          map.get(key)!.push(ticket.responseTimeHours);
          return map;
        }, new Map<string, number[]>())
    ).map(([date, times]) => ({
      date,
      hours: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10,
    })).sort((a, b) => a.date.localeCompare(b.date));

    const slaBreaches = groupByDate(
      tickets.filter(t => t.isSLABreached),
      'createdAt'
    );

    return {
      createdTickets,
      resolvedTickets,
      avgResponseTime: avgResponseTimeData,
      slaBreaches,
    };
  }

  /**
   * Get agent performance statistics
   */
  async getAgentPerformance(agentId?: string): Promise<Array<{
    agentId: string;
    agentName: string;
    assignedTickets: number;
    resolvedTickets: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    slaCompliance: number;
    activeTickets: number;
  }>> {
    const tenantId = this.getActiveTenantId();
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .where('ticket.tenantId = :tenantId', { tenantId })
      .andWhere('ticket.assignedToId IS NOT NULL');

    if (agentId) {
      query.andWhere('ticket.assignedToId = :agentId', { agentId });
    }

    const tickets = await query.getMany();

    const agentStats = new Map<string, {
      agentName: string;
      tickets: Ticket[];
    }>();

    tickets.forEach(ticket => {
      if (!ticket.assignedToId) return;

      if (!agentStats.has(ticket.assignedToId)) {
        agentStats.set(ticket.assignedToId, {
          agentName: ticket.assignedTo
            ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
            : 'Unknown',
          tickets: [],
        });
      }
      agentStats.get(ticket.assignedToId)!.tickets.push(ticket);
    });

    return Array.from(agentStats.entries()).map(([agentId, data]) => {
      const assignedTickets = data.tickets.length;
      const resolvedTickets = data.tickets.filter(
        t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
      ).length;

      const respondedTickets = data.tickets.filter(t => t.responseTimeHours > 0);
      const avgResponseTime = respondedTickets.length > 0
        ? respondedTickets.reduce((sum, t) => sum + t.responseTimeHours, 0) / respondedTickets.length
        : 0;

      const resolvedWithTime = data.tickets.filter(t => t.resolutionTimeHours > 0);
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, t) => sum + t.resolutionTimeHours, 0) / resolvedWithTime.length
        : 0;

      const ticketsWithSLA = data.tickets.filter(t => t.slaResolutionDueAt);
      const slaCompliant = ticketsWithSLA.filter(t => !t.isSLABreached).length;
      const slaCompliance = ticketsWithSLA.length > 0
        ? (slaCompliant / ticketsWithSLA.length) * 100
        : 0;

      const activeTickets = data.tickets.filter(
        t => t.status === TicketStatus.NEW || t.status === TicketStatus.OPEN
      ).length;

      return {
        agentId,
        agentName: data.agentName,
        assignedTickets,
        resolvedTickets,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        slaCompliance: Math.round(slaCompliance * 10) / 10,
        activeTickets,
      };
    }).sort((a, b) => b.resolvedTickets - a.resolvedTickets);
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<Array<{
    categoryId: string;
    categoryName: string;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
  }>> {
    const tenantId = this.getActiveTenantId();
    const tickets = await this.ticketRepository.find({
      relations: ['category'],
      where: {
        categoryId: Not(null) as any,
        tenantId
      }
    });

    const categoryMap = new Map<string, {
      name: string;
      tickets: Ticket[];
    }>();

    tickets.forEach(ticket => {
      if (!ticket.categoryId) return;

      if (!categoryMap.has(ticket.categoryId)) {
        categoryMap.set(ticket.categoryId, {
          name: ticket.category?.name || 'Unknown',
          tickets: [],
        });
      }
      categoryMap.get(ticket.categoryId)!.tickets.push(ticket);
    });

    return Array.from(categoryMap.entries()).map(([categoryId, data]) => {
      const totalTickets = data.tickets.length;
      const openTickets = data.tickets.filter(
        t => t.status === TicketStatus.NEW || t.status === TicketStatus.OPEN
      ).length;
      const resolvedTickets = data.tickets.filter(
        t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
      ).length;

      const resolvedWithTime = data.tickets.filter(t => t.resolutionTimeHours > 0);
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, t) => sum + t.resolutionTimeHours, 0) / resolvedWithTime.length
        : 0;

      return {
        categoryId,
        categoryName: data.name,
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      };
    }).sort((a, b) => b.totalTickets - a.totalTickets);
  }

  /**
   * Get tag analytics
   */
  async getTagStats(): Promise<Array<{
    tag: string;
    count: number;
    avgResolutionTime: number;
  }>> {
    const tenantId = this.getActiveTenantId();
    const tickets = await this.ticketRepository.find({
      where: {
        tags: Not(null) as any,
        tenantId
      }
    });

    const tagMap = new Map<string, Ticket[]>();

    tickets.forEach(ticket => {
      if (!ticket.tags) return;

      ticket.tags.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)!.push(ticket);
      });
    });

    return Array.from(tagMap.entries()).map(([tag, tickets]) => {
      const resolvedWithTime = tickets.filter(t => t.resolutionTimeHours > 0);
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, t) => sum + t.resolutionTimeHours, 0) / resolvedWithTime.length
        : 0;

      return {
        tag,
        count: tickets.length,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      };
    }).sort((a, b) => b.count - a.count);
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(userId?: string): Promise<{
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    mostUsedCategories: Array<{ category: string; count: number }>;
    mostUsedTags: Array<{ tag: string; count: number }>;
  }> {
    const tenantId = this.getActiveTenantId();
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.category', 'category')
      .where('ticket.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('ticket.userId = :userId', { userId });
    }

    const tickets = await query.getMany();

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      t => t.status === TicketStatus.NEW || t.status === TicketStatus.OPEN
    ).length;
    const resolvedTickets = tickets.filter(
      t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
    ).length;

    const resolvedWithTime = tickets.filter(t => t.resolutionTimeHours > 0);
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, t) => sum + t.resolutionTimeHours, 0) / resolvedWithTime.length
      : 0;

    const categoryCount = new Map<string, number>();
    tickets.forEach(ticket => {
      if (ticket.category) {
        const name = ticket.category.name;
        categoryCount.set(name, (categoryCount.get(name) || 0) + 1);
      }
    });

    const tagCount = new Map<string, number>();
    tickets.forEach(ticket => {
      if (ticket.tags) {
        ticket.tags.forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        });
      }
    });

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      mostUsedCategories: Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      mostUsedTags: Array.from(tagCount.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }
}

