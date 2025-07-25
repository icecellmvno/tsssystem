import { apiClient } from './api-client';

export interface ScheduleTask {
  id: number;
  name: string;
  description: string | null;
  device_group_id: number;
  task_type: 'ussd' | 'sms';
  command: string;
  recipient: string | null;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cron_expression: string | null;
  time: string;
  day_of_week: number | null;
  day_of_month: number | null;
  month: number | null;
  interval_minutes: number | null;
  is_active: boolean;
  dual_sim_support: boolean;
  fallback_to_single_sim: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  last_executed_at: string | null;
  next_execution_at: string | null;
  execution_count: number;
  success_count: number;
  failure_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  status_badge_variant: string;
  task_type_badge_variant: string;
  frequency_badge_variant: string;
  human_readable_frequency: string;
  success_rate: number;
  can_execute: boolean;
  can_pause: boolean;
  can_resume: boolean;
  device_group_data: {
    id: number;
    name: string;
  } | null;
}

export interface CreateScheduleTaskData {
  name: string;
  description?: string;
  device_group_id: number;
  task_type: 'ussd' | 'sms';
  command: string;
  recipient?: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cron_expression?: string;
  time: string;
  day_of_week?: number;
  day_of_month?: number;
  month?: number;
  interval_minutes?: number;
  is_active: boolean;
  dual_sim_support: boolean;
  fallback_to_single_sim: boolean;
  max_retries: number;
  retry_delay_minutes: number;
}

export interface UpdateScheduleTaskData extends Partial<CreateScheduleTaskData> {}

export interface ScheduleTasksResponse {
  data: ScheduleTask[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ScheduleTaskFilters {
  page?: number;
  per_page?: number;
  search?: string;
  task_type?: string;
  frequency?: string;
  status?: string;
  is_active?: string;
  sort_by?: string;
  sort_order?: string;
}

export const scheduleTasksService = {
  // Get all schedule tasks with filters
  async getScheduleTasks(filters: ScheduleTaskFilters = {}): Promise<ScheduleTasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/schedule-tasks?${params}`);
    return response.data;
  },

  // Get a single schedule task by ID
  async getScheduleTask(id: number): Promise<ScheduleTask> {
    const response = await apiClient.get(`/schedule-tasks/${id}`);
    return response.data.data;
  },

  // Create a new schedule task
  async createScheduleTask(data: CreateScheduleTaskData): Promise<ScheduleTask> {
    const response = await apiClient.post('/schedule-tasks', data);
    return response.data.data;
  },

  // Update an existing schedule task
  async updateScheduleTask(id: number, data: UpdateScheduleTaskData): Promise<ScheduleTask> {
    const response = await apiClient.put(`/schedule-tasks/${id}`, data);
    return response.data.data;
  },

  // Delete a schedule task
  async deleteScheduleTask(id: number): Promise<void> {
    await apiClient.delete(`/schedule-tasks/${id}`);
  },

  // Execute a schedule task
  async executeScheduleTask(id: number): Promise<{ message: string }> {
    const response = await apiClient.post(`/schedule-tasks/${id}/execute`);
    return response.data;
  },

  // Pause a schedule task
  async pauseScheduleTask(id: number): Promise<{ message: string }> {
    const response = await apiClient.post(`/schedule-tasks/${id}/pause`);
    return response.data;
  },

  // Resume a schedule task
  async resumeScheduleTask(id: number): Promise<{ message: string }> {
    const response = await apiClient.post(`/schedule-tasks/${id}/resume`);
    return response.data;
  },
}; 