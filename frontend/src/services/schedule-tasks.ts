import { apiClient } from './api-client';

export interface ScheduleTask {
  id: number;
  name: string;
  description?: string;
  cron_expression: string;
  command: string;
  status: string;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export const scheduleTasksService = {
  async getScheduleTasks(): Promise<{ schedule_tasks: ScheduleTask[] }> {
    return apiClient.get('/schedule-tasks');
  },

  async deleteScheduleTask(id: number): Promise<void> {
    return apiClient.delete(`/schedule-tasks/${id}`);
  },
}; 