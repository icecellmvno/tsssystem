import { apiClient } from './api-client';

export interface Filter {
  id: number;
  name: string;
  description?: string;
  type: string;
  conditions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const filtersService = {
  async getFilters(): Promise<{ filters: Filter[] }> {
    return apiClient.get('/filters');
  },

  async getFilter(id: number): Promise<Filter> {
    return apiClient.get(`/filters/${id}`);
  },

  async createFilter(data: any): Promise<Filter> {
    return apiClient.post('/filters', data);
  },

  async updateFilter(id: number, data: any): Promise<Filter> {
    return apiClient.put(`/filters/${id}`, data);
  },

  async deleteFilter(id: number): Promise<void> {
    return apiClient.delete(`/filters/${id}`);
  },

  async bulkDeleteFilters(ids: number[]): Promise<void> {
    return apiClient.delete(`/filters/bulk?ids=${ids.join(',')}`);
  },

  async toggleFilterStatus(id: number): Promise<Filter> {
    return apiClient.patch(`/filters/${id}/toggle`);
  },
}; 