import { apiClient } from './api-client';

export interface Permission {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  role_count?: number;
}

export const permissionsService = {
  async getPermissions(): Promise<{ permissions: Permission[] }> {
    return apiClient.get('/permissions');
  },

  async deletePermission(id: number): Promise<void> {
    return apiClient.delete(`/permissions/${id}`);
  },
}; 