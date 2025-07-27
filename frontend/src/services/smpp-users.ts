import { apiClient } from './api-client';

export interface SmppUser {
  id: number;
  username: string;
  password: string;
  system_id: string;
  system_type: string;
  interface_version: string;
  addr_ton: number;
  addr_npi: number;
  address_range: string;
  status: string;
  max_connections: number;
  created_at: string;
  updated_at: string;
}

export const smppUsersService = {
  async getSmppUsers(): Promise<{ data: SmppUser[] }> {
    return apiClient.get('/smpp-users');
  },

  async deleteSmppUser(id: number): Promise<void> {
    return apiClient.delete(`/smpp-users/${id}`);
  },
}; 