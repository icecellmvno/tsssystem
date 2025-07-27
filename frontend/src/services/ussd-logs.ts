import { apiClient } from './api-client';

export interface UssdLog {
  id: number;
  device_id: string;
  device_name?: string;
  ussd_code: string;
  response: string;
  status: string;
  duration_ms: number;
  created_at: string;
  updated_at: string;
}

export const ussdLogsService = {
  async getUssdLogs(): Promise<{ ussd_logs: UssdLog[] }> {
    return apiClient.get('/ussd-logs');
  },

  async deleteUssdLog(id: number): Promise<void> {
    return apiClient.delete(`/ussd-logs/${id}`);
  },
}; 