import { apiClient } from './api-client';

export interface AlarmLog {
  id: number;
  device_id: string;
  device_name: string;
  device_group: string;
  country_site: string;
  alarm_type: string;
  severity: string;
  message: string;
  status: string;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
  created_at: string;
  updated_at: string;
}

export const alarmLogsService = {
  async getAlarmLogs(): Promise<{ data: AlarmLog[]; total: number; page: number; limit: number }> {
    return apiClient.get('/alarm-logs');
  },

  async deleteAlarmLog(id: number): Promise<void> {
    return apiClient.delete(`/alarm-logs/${id}`);
  },
}; 