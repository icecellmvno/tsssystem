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
  task_type?: string;
  frequency?: string;
  device_group_data?: { name: string };
  device_group_id?: number;
  is_active?: boolean;
  execution_count?: number;
  success_count?: number;
  failure_count?: number;
  success_rate?: number;
  last_executed_at?: string;
  next_execution_at?: string;
  recipient?: string;
  max_retries?: number;
  retry_delay_minutes?: number;
  dual_sim_support?: boolean;
  fallback_to_single_sim?: boolean;
  human_readable_frequency?: string;
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  month?: number;
  interval_minutes?: number;
  last_error?: string;
  can_execute?: boolean;
  can_pause?: boolean;
  can_resume?: boolean;
}

export interface CreateScheduleTaskData {
  name: string;
  description?: string;
  cron_expression: string;
  command: string;
  task_type?: string;
  frequency?: string;
  device_group_id?: number;
  is_active?: boolean;
  recipient?: string;
  max_retries?: number;
  retry_delay_minutes?: number;
  dual_sim_support?: boolean;
  fallback_to_single_sim?: boolean;
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  month?: number;
  interval_minutes?: number;
}

export interface UpdateScheduleTaskData extends Partial<CreateScheduleTaskData> {}

export const scheduleTasksService = {
  async getScheduleTasks(): Promise<{ schedule_tasks: ScheduleTask[] }> {
    return apiClient.get('/schedule-tasks');
  },

  async getScheduleTask(id: number): Promise<ScheduleTask> {
    return apiClient.get(`/schedule-tasks/${id}`);
  },

  async createScheduleTask(data: CreateScheduleTaskData): Promise<ScheduleTask> {
    return apiClient.post('/schedule-tasks', data);
  },

  async updateScheduleTask(id: number, data: UpdateScheduleTaskData): Promise<ScheduleTask> {
    return apiClient.put(`/schedule-tasks/${id}`, data);
  },

  async deleteScheduleTask(id: number): Promise<void> {
    return apiClient.delete(`/schedule-tasks/${id}`);
  },

  async executeScheduleTask(id: number): Promise<{ message: string }> {
    return apiClient.post(`/schedule-tasks/${id}/execute`);
  },

  async pauseScheduleTask(id: number): Promise<{ message: string }> {
    return apiClient.post(`/schedule-tasks/${id}/pause`);
  },

  async resumeScheduleTask(id: number): Promise<{ message: string }> {
    return apiClient.post(`/schedule-tasks/${id}/resume`);
  },
}; 