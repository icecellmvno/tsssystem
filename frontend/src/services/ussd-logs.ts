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
  session_id?: string;
  sim_slot?: number;
  device_imei?: string;
  device_imsi?: string;
  device_group?: string;
  country_site?: string;
  request_message?: string;
  response_message?: string;
  error_message?: string;
  sent_at?: string;
  received_at?: string;
  metadata?: any;
}

export const ussdLogsService = {
  async getUssdLogs(): Promise<{ ussd_logs: UssdLog[] }> {
    return apiClient.get('/ussd-logs');
  },

  async getUssdLog(id: number): Promise<UssdLog> {
    return apiClient.get(`/ussd-logs/${id}`);
  },

  async deleteUssdLog(id: number): Promise<void> {
    return apiClient.delete(`/ussd-logs/${id}`);
  },
}; 