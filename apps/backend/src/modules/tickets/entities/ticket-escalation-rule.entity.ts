import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

/**
 * Ticket Escalation Rule Entity
 * 
 * Defines rules for automatic ticket escalation based on various conditions
 * 
 * Example:
 * - When priority = "urgent" and no response in 2 hours → Escalate to Tier 2
 * - When category = "billing" and open for 24 hours → Escalate to Billing Manager
 */
@Entity('ticket_escalation_rules')
export class TicketEscalationRule extends BaseEntity {
  // id, createdAt, updatedAt, tenantId inherited from BaseEntity

  /**
   * Rule name
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  /**
   * Rule description
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  /**
   * Is rule active?
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  /**
   * Conditions that must be met for rule to trigger
   * 
   * Examples:
   * - { "priority": "urgent" } - Only if priority is urgent
   * - { "status": "new" } - Only if status is new
   * - { "hoursSinceCreation": { "$gte": 2 } } - Only if open for 2+ hours
   * - { "categoryId": "billing-category-id" } - Only if category is billing
   * - { "escalationLevel": 0 } - Only if not yet escalated
   */
  @Column({
    type: 'jsonb',
    default: {},
  })
  conditions: Record<string, any>;

  /**
   * Escalation actions to take when rule triggers
   * 
   * Example:
   * {
   *   "assignToId": "manager-user-id",
   *   "setPriority": "high",
   *   "addNote": "Automatically escalated due to SLA breach",
   *   "notifySupervisors": true,
   *   "increaseEscalationLevel": true
   * }
   */
  @Column({
    type: 'jsonb',
  })
  actions: Record<string, any>;

  /**
   * Priority (higher = executed first)
   */
  @Column({
    type: 'int',
    default: 0,
  })
  priority: number;

  /**
   * Maximum number of times this rule can be applied to a ticket
   */
  @Column({
    type: 'int',
    default: 1,
  })
  maxApplications: number;

  // inherited from BaseEntity


  /**
   * Check if rule should trigger for given ticket and context
   */
  shouldTrigger(ticket: any, context: {
    hoursSinceCreation: number;
    hoursSinceUpdate: number;
    escalationLevel: number;
  }): boolean {
    // Check if rule is active
    if (!this.isActive) {
      return false;
    }

    // Check conditions
    return this.matchesConditions(ticket, context);
  }

  /**
   * Check if ticket and context match conditions
   */
  private matchesConditions(
    ticket: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    // If no conditions, always match
    if (!this.conditions || Object.keys(this.conditions).length === 0) {
      return true;
    }

    // Merge ticket and context for condition checking
    const data = { ...ticket, ...context };

    // Check each condition
    for (const [key, value] of Object.entries(this.conditions)) {
      // Handle nested properties (e.g., "metadata.customerTier")
      const dataValue = this.getNestedProperty(data, key);

      // Handle operators like $gt, $lt, etc.
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [operator, operandValue] of Object.entries(value)) {
          switch (operator) {
            case '$gt':
              if (!(dataValue > (operandValue as number))) return false;
              break;
            case '$gte':
              if (!(dataValue >= (operandValue as number))) return false;
              break;
            case '$lt':
              if (!(dataValue < (operandValue as number))) return false;
              break;
            case '$lte':
              if (!(dataValue <= (operandValue as number))) return false;
              break;
            case '$ne':
              if (dataValue === operandValue) return false;
              break;
            case '$in':
              if (!Array.isArray(operandValue) || !operandValue.includes(dataValue)) {
                return false;
              }
              break;
            case '$nin':
              if (Array.isArray(operandValue) && operandValue.includes(dataValue)) {
                return false;
              }
              break;
            case '$regex':
              if (typeof dataValue !== 'string' || !new RegExp(operandValue as string).test(dataValue)) {
                return false;
              }
              break;
            default:
              // Unknown operator
              return false;
          }
        }
      } else {
        // Simple equality check
        if (dataValue !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get nested property value using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }
}