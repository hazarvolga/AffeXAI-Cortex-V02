/**
 * Ticket Status Enum
 * Defines the lifecycle states of a support ticket
 */
export enum TicketStatus {
  /** Ticket just created, not yet assigned or reviewed */
  NEW = 'new',
  
  /** Ticket is being worked on by a support agent */
  OPEN = 'open',
  
  /** Waiting for customer response or action */
  PENDING_CUSTOMER = 'pending_customer',
  
  /** Waiting for internal team response (different department) */
  PENDING_INTERNAL = 'pending_internal',
  
  /** Waiting for third party response or action */
  PENDING_THIRD_PARTY = 'pending_third_party',
  
  /** Solution provided, waiting for customer confirmation */
  RESOLVED = 'resolved',
  
  /** Ticket is closed and completed */
  CLOSED = 'closed',
  
  /** Ticket was cancelled (invalid or duplicate) */
  CANCELLED = 'cancelled',
}