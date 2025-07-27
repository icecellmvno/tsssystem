import { apiClient } from './api-client';

export interface BlacklistNumber {
  id: number;
  number: string;
  type: 'sms' | 'manual';
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedBlacklistNumbers {
  data: BlacklistNumber[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: any[];
}

export const blacklistNumbersService = {
  async getBlacklistNumbers(params?: {
    search?: string;
    type?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedBlacklistNumbers> {
    return apiClient.get('/blacklist-numbers', params);
  },

  async deleteBlacklistNumber(id: number): Promise<void> {
    return apiClient.delete(`/blacklist-numbers/${id}`);
  },

  async bulkDeleteBlacklistNumbers(ids: number[]): Promise<void> {
    return apiClient.delete(`/blacklist-numbers/bulk?ids=${ids.join(',')}`);
  },

  async importBlacklistNumbers(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/blacklist-numbers/import', formData);
  },

  async pasteImportBlacklistNumbers(lines: string): Promise<any> {
    return apiClient.post('/blacklist-numbers/paste-import', { lines });
  },
}; 