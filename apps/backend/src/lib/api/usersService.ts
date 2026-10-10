import httpClient from './httpClient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
}

class UsersService {
  async getAllUsers(): Promise<User[]> {
    return httpClient.get<User[]>('/users');
  }

  async getUserById(id: string): Promise<User> {
    return httpClient.get<User>(`/users/${id}`);
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    return httpClient.post<User>('/users', userData);
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    return httpClient.patch<User>(`/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<void> {
    return httpClient.delete<void>(`/users/${id}`);
  }
}

export default new UsersService();