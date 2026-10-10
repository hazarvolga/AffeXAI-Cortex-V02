import httpClient from './httpClient';

export interface Group {
  id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  subscriberCount?: number;
}

class GroupsService {
  async getAllGroups(): Promise<Group[]> {
    return httpClient.get<Group[]>('/email-marketing/groups');
  }

  async getGroupById(id: string): Promise<Group> {
    return httpClient.get<Group>(`/email-marketing/groups/${id}`);
  }

  async createGroup(groupData: CreateGroupDto): Promise<Group> {
    return httpClient.post<Group>('/email-marketing/groups', groupData);
  }

  async updateGroup(id: string, groupData: UpdateGroupDto): Promise<Group> {
    return httpClient.patch<Group>(`/email-marketing/groups/${id}`, groupData);
  }

  async deleteGroup(id: string): Promise<void> {
    return httpClient.delete<void>(`/email-marketing/groups/${id}`);
  }
}

export default new GroupsService();