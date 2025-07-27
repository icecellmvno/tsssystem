import { apiClient } from './api-client';

export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  username?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export const usersService = {
  async getUsers(): Promise<{ users: User[] }> {
    return apiClient.get('/users');
  },

  async getUserById(id: number): Promise<{ user: User }> {
    return apiClient.get(`/users/${id}`);
  },

  async createUser(data: UserCreateRequest): Promise<{ message: string; user: User }> {
    return apiClient.post('/users', data);
  },

  async updateUser(id: number, data: UserUpdateRequest): Promise<{ message: string; user: User }> {
    return apiClient.put(`/users/${id}`, data);
  },

  async deleteUser(id: number): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
}; 