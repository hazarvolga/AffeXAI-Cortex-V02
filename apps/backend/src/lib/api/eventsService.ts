import httpClient from './httpClient';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  price: number; // Add price field
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  price: number; // Add price field
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  capacity?: number;
  price?: number; // Add price field
}

// Add interface for dashboard stats
export interface DashboardStats {
  upcomingEvents: number;
  totalTicketSales: number;
  totalParticipants: number;
  monthlyRevenue: number;
  revenueChange: number;
}

class EventsService {
  async getAllEvents(): Promise<Event[]> {
    return httpClient.get<Event[]>('/events');
  }

  async getEventById(id: string): Promise<Event> {
    return httpClient.get<Event>(`/events/${id}`);
  }

  // Add method to fetch dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    return httpClient.get<DashboardStats>('/events/stats');
  }

  async createEvent(eventData: CreateEventDto): Promise<Event> {
    return httpClient.post<Event>('/events', eventData);
  }

  async updateEvent(id: string, eventData: UpdateEventDto): Promise<Event> {
    return httpClient.patch<Event>(`/events/${id}`, eventData);
  }

  async deleteEvent(id: string): Promise<void> {
    return httpClient.delete<void>(`/events/${id}`);
  }
}

export default new EventsService();