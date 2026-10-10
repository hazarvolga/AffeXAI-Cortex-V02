import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEscalationRule } from '../entities/ticket-escalation-rule.entity';
import { Ticket } from '../entities/ticket.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Ticket Escalation Rules Service
 * 
 * Manages ticket escalation rules and executes automatic escalations
 */
@Injectable()
export class TicketEscalationRulesService {
  private readonly logger = new Logger(TicketEscalationRulesService.name);

  constructor(
    @InjectRepository(TicketEscalationRule)
    private readonly ruleRepository: Repository<TicketEscalationRule>,
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
   * Get all active escalation rules ordered by priority
   */
  async getActiveRules(): Promise<TicketEscalationRule[]> {
    const tenantId = this.getActiveTenantId();
    return this.ruleRepository.find({
      where: { isActive: true, tenantId },
      order: { priority: 'DESC' },
    });
  }

  /**
   * Get escalation rule by ID
   */
  async findOne(id: string): Promise<TicketEscalationRule> {
    const tenantId = this.getActiveTenantId();
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`Ticket escalation rule not found: ${id}`);
    }
    return rule;
  }

  /**
   * Create new escalation rule
   */
  async create(data: Partial<TicketEscalationRule>): Promise<TicketEscalationRule> {
    const tenantId = this.getActiveTenantId();
    const rule = this.ruleRepository.create({
      ...data,
      tenantId,
    });
    return this.ruleRepository.save(rule);
  }

  /**
   * Update escalation rule
   */
  async update(id: string, data: Partial<TicketEscalationRule>): Promise<TicketEscalationRule> {
    const tenantId = this.getActiveTenantId();
    await this.ruleRepository.update({ id, tenantId }, data);
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`Ticket escalation rule not found: ${id}`);
    }
    return rule;
  }

  /**
   * Delete escalation rule
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    await this.ruleRepository.delete({ id, tenantId });
  }

  /**
   * Toggle rule active status
   */
  async toggle(id: string): Promise<TicketEscalationRule> {
    const tenantId = this.getActiveTenantId();
    const rule = await this.ruleRepository.findOne({ where: { id, tenantId } });
    if (!rule) {
      throw new Error(`Rule not found: ${id}`);
    }

    rule.isActive = !rule.isActive;
    return this.ruleRepository.save(rule);
  }

  /**
   * Get all escalation rules
   */
  async findAll(): Promise<TicketEscalationRule[]> {
    const tenantId = this.getActiveTenantId();
    return this.ruleRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if rule has already been applied to ticket max times
   */
  hasReachedMaxApplications(rule: TicketEscalationRule, ticket: Ticket): boolean {
    if (!ticket.escalationHistory) {
      return false;
    }

    // Count applications by matching rule ID in escalation history
    // Note: We store the rule ID in the escalation history, not the level number
    const applications = ticket.escalationHistory.filter(
      entry => entry['ruleId'] === rule.id
    ).length;

    return applications >= rule.maxApplications;
  }
}