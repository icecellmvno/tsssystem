import { apiClient } from './api-client';

export interface AlarmLog {
  id: number;
  device_id: string;
  device_name?: string;
  alarm_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const alarmLogsService = {
  async getAlarmLogs(): Promise<{ alarm_logs: AlarmLog[] }> {
    return apiClient.get('/alarm-logs');
  },

  async deleteAlarmLog(id: number): Promise<void> {
    return apiClient.delete(`/alarm-logs/${id}`);
  },
}; 