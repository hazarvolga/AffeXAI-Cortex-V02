import { BaseApiService } from './base-service';

/**
 * Ticket Priority Enum
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Ticket Status Enum
 * Must match backend enum exactly
 */
export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_INTERNAL = 'pending_internal',
  PENDING_THIRD_PARTY = 'pending_third_party',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

/**
 * Ticket Category Interface
 */
export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: TicketCategory;
  children?: TicketCategory[];
  ticketCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ticket Message Interface
 */
export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attachments?: TicketAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ticket Attachment Interface
 */
export interface TicketAttachment {
  id: string;
  ticketId: string;
  messageId?: string;
  userId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

/**
 * Ticket Interface
 */
export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string;
  userId: string;
  assignedToId?: string;
  category?: TicketCategory;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];

  // SLA Tracking Fields
  slaFirstResponseDueAt?: Date;
  slaResolutionDueAt?: Date;
  isSLABreached?: boolean;
  responseTimeHours?: number;
  resolutionTimeHours?: number;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Ticket DTO
 */
export interface CreateTicketDto {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId: string;
}

/**
 * Update Ticket DTO
 */
export interface UpdateTicketDto {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  categoryId?: string;
}

/**
 * Update Ticket Status DTO
 */
export interface UpdateTicketStatusDto {
  status: TicketStatus;
  notes?: string;
}

/**
 * Assign Ticket DTO
 */
export interface AssignTicketDto {
  assignedToId: string;
}

/**
 * Add Ticket Message DTO
 */
export interface AddTicketMessageDto {
  content: string;
  isInternal?: boolean;
}

/**
 * Filter Tickets DTO
 */
export interface FilterTicketsDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  userId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Ticket Statistics
 */
export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  slaCompliance: number;
  slaBreaches: number;
  total: number;
  byStatus: { new: number; open: number; pendingCustomer: number; resolved: number; closed: number };
}

/**
 * Neural Context Interface
 */
export interface NeuralTicketContext {
  ticketId: string;
  subject: string;
  aiInsight: string;
  learningSource: string;
  timestamp: Date;
}

/**
 * Tickets Service
 */
class TicketsService extends BaseApiService<Ticket, CreateTicketDto, UpdateTicketDto> {
  constructor() {
    super({
      endpoint: '/tickets',
      useWrappedResponses: true // Backend uses global ApiResponse wrapper
    });
  }

  /**
   * Get all tickets with optional filters
   */
  async getTickets(filters?: FilterTicketsDto): Promise<Ticket[]> {
    const queryString = filters
      ? `?${new URLSearchParams(filters as any).toString()}`
      : '';
    return this.client.getWrapped<Ticket[]>(`${this.endpoint}${queryString}`);
  }

  /**
   * Get ticket by ID with full details (messages, attachments, etc.)
   */
  async getTicketById(id: string): Promise<Ticket> {
    return this.client.getWrapped<Ticket>(`${this.endpoint}/${id}`);
  }

  /**
   * [NEURAL GRID] Get intelligence and success-proven insights for a ticket
   */
  async getNeuralContext(id: string): Promise<NeuralTicketContext> {
    return this.client.getWrapped<NeuralTicketContext>(`${this.endpoint}/${id}/neural-context`);
  }

  /**
   * Create new ticket
   */
  async createTicket(data: CreateTicketDto): Promise<Ticket> {
    return this.client.postWrapped<Ticket>(this.endpoint, data);
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, data: UpdateTicketDto): Promise<Ticket> {
    return this.client.patchWrapped<Ticket>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(id: string, data: UpdateTicketStatusDto): Promise<Ticket> {
    return this.client.patchWrapped<Ticket>(`${this.endpoint}/${id}/status`, data);
  }

  /**
   * Assign ticket to user
   */
  async assignTicket(id: string, data: AssignTicketDto): Promise<Ticket> {
    return this.client.patchWrapped<Ticket>(`${this.endpoint}/${id}/assign`, data);
  }

  /**
   * Add message to ticket
   */
  async addMessage(id: string, data: AddTicketMessageDto): Promise<TicketMessage> {
    return this.client.postWrapped<TicketMessage>(`${this.endpoint}/${id}/messages`, data);
  }

  /**
   * Get all ticket categories (hierarchical)
   */
  async getCategories(): Promise<TicketCategory[]> {
    return this.client.getWrapped<TicketCategory[]>(`${this.endpoint}/categories/list`);
  }

  /**
   * Get ticket statistics
   */
  async getStats(): Promise<TicketStats> {
    return this.client.getWrapped<TicketStats>(`${this.endpoint}/stats/overview`);
  }

  /**
   * Close ticket (convenience method)
   */
  async closeTicket(id: string, notes?: string): Promise<Ticket> {
    return this.updateTicketStatus(id, {
      status: TicketStatus.CLOSED,
      notes
    });
  }

  /**
   * Resolve ticket (convenience method)
   */
  async resolveTicket(id: string, notes?: string): Promise<Ticket> {
    return this.updateTicketStatus(id, {
      status: TicketStatus.RESOLVED,
      notes
    });
  }

  /**
   * Reopen ticket (convenience method)
   */
  async reopenTicket(id: string, notes?: string): Promise<Ticket> {
    return this.updateTicketStatus(id, {
      status: TicketStatus.OPEN,
      notes
    });
  }

  /**
   * Merge tickets
   */
  async mergeTickets(ticketIds: string[], targetTicketId: string, mergeNote?: string): Promise<Ticket> {
    return this.client.postWrapped<Ticket>(`${this.endpoint}/merge`, {
      ticketIds,
      targetTicketId,
      mergeNote,
    });
  }

  /**
   * Split ticket
   */
  async splitTicket(originalTicketId: string, splitData: {
    newTicketSubject: string;
    newTicketDescription: string;
    newTicketPriority?: string;
    newTicketCategoryId?: string;
    messageIds?: string[];
    splitNote?: string;
  }): Promise<{ originalTicket: Ticket; newTicket: Ticket }> {
    return this.client.postWrapped<{ originalTicket: Ticket; newTicket: Ticket }>(`${this.endpoint}/split`, {
      originalTicketId,
      ...splitData,
    });
  }

  /**
   * Get my tickets (current user's tickets)
   */
  async getMyTickets(filters?: Omit<FilterTicketsDto, 'userId'>): Promise<Ticket[]> {
    return this.getTickets(filters);
  }

  /**
   * Get priority label in Turkish
   */
  getPriorityLabel(priority: TicketPriority): string {
    const labels = {
      [TicketPriority.LOW]: 'Düşük',
      [TicketPriority.MEDIUM]: 'Orta',
      [TicketPriority.HIGH]: 'Yüksek',
      [TicketPriority.URGENT]: 'Acil'
    };
    return labels[priority] || priority;
  }

  /**
   * Get status label in Turkish
   */
  getStatusLabel(status: TicketStatus): string {
    const labels = {
      [TicketStatus.NEW]: 'Yeni',
      [TicketStatus.OPEN]: 'Açık',
      [TicketStatus.PENDING_CUSTOMER]: 'Müşteri Bekliyor',
      [TicketStatus.PENDING_INTERNAL]: 'İç Ekip Bekliyor',
      [TicketStatus.PENDING_THIRD_PARTY]: 'Üçüncü Taraf Bekliyor',
      [TicketStatus.RESOLVED]: 'Çözüldü',
      [TicketStatus.CLOSED]: 'Kapalı',
      [TicketStatus.CANCELLED]: 'İptal Edildi'
    };
    return labels[status] || status;
  }

  /**
   * Get priority color for UI
   */
  getPriorityColor(priority: TicketPriority): string {
    const colors = {
      [TicketPriority.LOW]: 'text-blue-600 bg-blue-50',
      [TicketPriority.MEDIUM]: 'text-yellow-600 bg-yellow-50',
      [TicketPriority.HIGH]: 'text-orange-600 bg-orange-50',
      [TicketPriority.URGENT]: 'text-red-600 bg-red-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: TicketStatus): string {
    const colors = {
      [TicketStatus.NEW]: 'text-sky-600 bg-sky-50',
      [TicketStatus.OPEN]: 'text-blue-600 bg-blue-50',
      [TicketStatus.PENDING_CUSTOMER]: 'text-yellow-600 bg-yellow-50',
      [TicketStatus.PENDING_INTERNAL]: 'text-purple-600 bg-purple-50',
      [TicketStatus.PENDING_THIRD_PARTY]: 'text-orange-600 bg-orange-50',
      [TicketStatus.RESOLVED]: 'text-green-600 bg-green-50',
      [TicketStatus.CLOSED]: 'text-gray-600 bg-gray-50',
      [TicketStatus.CANCELLED]: 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  }
}

export const ticketsService = new TicketsService();
export default ticketsService;
