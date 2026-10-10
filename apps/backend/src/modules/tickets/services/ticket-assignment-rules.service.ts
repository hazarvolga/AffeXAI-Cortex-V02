import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAssignmentRule } from '../entities/ticket-assignment-rule.entity';
import { Ticket } from '../entities/ticket.entity';
import { TenantService } from '../../../core/tenant/tenant.service';
import { User } from '../../users/entities/user.entity';

/**
 * Ticket Assignment Rules Service
 * 
 * Manages ticket assignment rules and executes automatic assignments
 */
@Injectable()
export class TicketAssignmentRulesService {
  private readonly logger = new Logger(TicketAssignmentRulesService.name);

  constructor(
    @InjectRepository(TicketAssignmentRule)
    private readonly ruleRepository: Repository<TicketAssignmentRule>,
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
   * Get all active assignment rules ordered by priority
   */
  async getActiveRules(): Promise<TicketAssignmentRule[]> {
    const tenantId = this.getActiveTenantId();
    return this.ruleRepository.find({
      where: { isActive: true, tenantId },
      order: { priority: 'DESC' },
    });
  }

  /**
   * Get assignment rule by ID
   */
  async findOne(id: string): Promise<TicketAssignmentRule> {
    const tenantId = this.getActiveTenantId();
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`Ticket assignment rule not found: ${id}`);
    }
    return rule;
  }

  /**
   * Create new assignment rule
   */
  async create(data: Partial<TicketAssignmentRule>): Promise<TicketAssignmentRule> {
    const tenantId = this.getActiveTenantId();
    const rule = this.ruleRepository.create({
      ...data,
      tenantId,
    });
    return this.ruleRepository.save(rule);
  }

  /**
   * Update assignment rule
   */
  async update(id: string, data: Partial<TicketAssignmentRule>): Promise<TicketAssignmentRule> {
    const tenantId = this.getActiveTenantId();
    await this.ruleRepository.update({ id, tenantId }, data);
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`Ticket assignment rule not found: ${id}`);
    }
    return rule;
  }

  /**
   * Delete assignment rule
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    await this.ruleRepository.delete({ id, tenantId });
  }

  /**
   * Toggle rule active status
   */
  async toggle(id: string): Promise<TicketAssignmentRule> {
    const tenantId = this.getActiveTenantId();
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }

    rule.isActive = !rule.isActive;
    return this.ruleRepository.save(rule);
  }

  /**
   * Automatically assign ticket based on rules
   * Returns the assigned user ID or null if no rule matched
   */
  async autoAssignTicket(ticket: Ticket): Promise<string | null> {
    // Get all active rules ordered by priority
    const rules = await this.getActiveRules();

    // Check each rule in priority order
    for (const rule of rules) {
      // Skip if ticket is already assigned and rule is configured to skip
      if (ticket.assignedToId && rule.skipIfAssigned) {
        continue;
      }

      // Check if rule should trigger for this ticket
      if (rule.shouldTrigger(ticket)) {
        this.logger.log(
          `Auto-assigning ticket ${ticket.id} to user ${rule.assignToId} based on rule: ${rule.name}`,
          { ruleId: rule.id, ticketId: ticket.id }
        );
        return rule.assignToId;
      }
    }

    // No matching rule found
    return null;
  }

  /**
   * Get all assignment rules
   */
  async findAll(): Promise<TicketAssignmentRule[]> {
    const tenantId = this.getActiveTenantId();
    return this.ruleRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}