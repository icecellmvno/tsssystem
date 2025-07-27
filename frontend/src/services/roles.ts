import { apiClient } from './api-client';

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
  user_count?: number;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export const rolesService = {
  async getRoles(): Promise<{ roles: Role[] }> {
    return apiClient.get('/roles');
  },

  async deleteRole(id: number): Promise<void> {
    return apiClient.delete(`/roles/${id}`);
  },
}; 