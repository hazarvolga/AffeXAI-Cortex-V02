import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

/**
 * Ticket Assignment Rule Entity
 * 
 * Defines rules for automatic ticket assignment to support agents
 * 
 * Example:
 * - When category = "billing" → Assign to billing team
 * - When priority = "urgent" → Assign to senior support
 * - When company = "enterprise" → Assign to account manager
 */
@Entity('ticket_assignment_rules')
export class TicketAssignmentRule extends BaseEntity {
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
   * - { "categoryId": "billing-category-id" } - Only if category is billing
   * - { "priority": "urgent" } - Only if priority is urgent
   * - { "companyName": "Enterprise Corp" } - Only if company is Enterprise Corp
   * - { "metadata.customerTier": "premium" } - Only if customer tier is premium
   */
  @Column({
    type: 'jsonb',
    default: {},
  })
  conditions: Record<string, any>;

  /**
   * Assignment target (user ID to assign tickets to)
   */
  @Column({
    type: 'uuid',
  })
  assignToId: string;

  /**
   * Priority (higher = executed first)
   */
  @Column({
    type: 'int',
    default: 0,
  })
  priority: number;

  /**
   * Should skip assignment if ticket is already assigned?
   */
  @Column({
    type: 'boolean',
    default: true,
    name: 'skip_if_assigned',
  })
  skipIfAssigned: boolean;

  // inherited from BaseEntity


  /**
   * Check if rule should trigger for given ticket
   */
  shouldTrigger(ticket: any): boolean {
    // Check if rule is active
    if (!this.isActive) {
      return false;
    }

    // Check conditions
    return this.matchesConditions(ticket);
  }

  /**
   * Check if ticket matches conditions
   */
  private matchesConditions(ticket: Record<string, any>): boolean {
    // If no conditions, always match
    if (!this.conditions || Object.keys(this.conditions).length === 0) {
      return true;
    }

    // Check each condition
    for (const [key, value] of Object.entries(this.conditions)) {
      // Handle nested properties (e.g., "metadata.customerTier")
      const ticketValue = this.getNestedProperty(ticket, key);

      // Handle operators like $gt, $lt, etc.
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [operator, operandValue] of Object.entries(value)) {
          switch (operator) {
            case '$gt':
              if (!(ticketValue > (operandValue as number))) return false;
              break;
            case '$gte':
              if (!(ticketValue >= (operandValue as number))) return false;
              break;
            case '$lt':
              if (!(ticketValue < (operandValue as number))) return false;
              break;
            case '$lte':
              if (!(ticketValue <= (operandValue as number))) return false;
              break;
            case '$ne':
              if (ticketValue === operandValue) return false;
              break;
            case '$in':
              if (!Array.isArray(operandValue) || !operandValue.includes(ticketValue)) {
                return false;
              }
              break;
            case '$nin':
              if (Array.isArray(operandValue) && operandValue.includes(ticketValue)) {
                return false;
              }
              break;
            case '$regex':
              if (typeof ticketValue !== 'string' || !new RegExp(operandValue as string).test(ticketValue)) {
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
        if (ticketValue !== value) {
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