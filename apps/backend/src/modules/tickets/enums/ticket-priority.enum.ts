/**
 * Ticket Priority Enum
 * Defines the urgency level of a support ticket
 */
export enum TicketPriority {
  /** Minor issue, no immediate impact */
  LOW = 'low',
  
  /** Regular issue, normal handling */
  MEDIUM = 'medium',
  
  /** Important issue, requires quick attention */
  HIGH = 'high',
  
  /** Critical issue, system down or blocking work */
  URGENT = 'urgent',
}
