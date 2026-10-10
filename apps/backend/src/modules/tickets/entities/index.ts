/**
 * Tickets Module Entities
 * Centralized export for all ticket-related entities
 */
export { Ticket } from './ticket.entity';
export { TicketMessage } from './ticket-message.entity';
export { TicketCategory } from './ticket-category.entity';
// Re-export chat entities from chat module to avoid duplicates
export { ChatSession } from '../../chat/entities/chat-session.entity';
export { ChatMessage } from '../../chat/entities/chat-message.entity';
