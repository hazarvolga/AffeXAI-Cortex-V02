import { httpClient } from './http-client';

export interface OrganizationSummary { id: string; name: string; slug: string; isActive: boolean; settings?: Record<string, unknown>; createdAt: string; updatedAt: string; }
export interface OrganizationMember { id: string; email: string; firstName: string; lastName: string; isActive: boolean; roles: string[]; createdAt: string; }

class OrganizationsService {
  getCurrent(): Promise<OrganizationSummary> { return httpClient.getWrapped('/organizations/current'); }
  listMembers(): Promise<OrganizationMember[]> { return httpClient.getWrapped('/organizations/current/members'); }
  linkMember(userId: string): Promise<void> { return httpClient.postWrapped(`/organizations/current/members/${userId}`, {}); }
  removeMember(userId: string): Promise<void> { return httpClient.deleteWrapped(`/organizations/current/members/${userId}`); }
}

export const organizationsService = new OrganizationsService();
