import { apiClient } from './api-client';

export interface UssdLog {
  id: number;
  session_id: string;
  device_id: string;
  device_name?: string;
  device_imei?: string;
  device_imsi?: string;
  sim_slot?: number;
  ussd_code: string;
  request_message?: string;
  response_message?: string;
  status: string;
  sent_at?: string;
  received_at?: string;
  error_message?: string;
  metadata?: any;
  device_group_id?: number;
  device_group?: string;
  country_site_id?: number;
  country_site?: string;
  created_at: string;
  updated_at: string;
}

export const ussdLogsService = {
  async getUssdLogs(): Promise<{ data: UssdLog[] }> {
    return apiClient.get('/ussd-logs');
  },

  async getUssdLog(id: number): Promise<UssdLog> {
    return apiClient.get(`/ussd-logs/${id}`);
  },

  async deleteUssdLog(id: number): Promise<void> {
    return apiClient.delete(`/ussd-logs/${id}`);
  },
}; 