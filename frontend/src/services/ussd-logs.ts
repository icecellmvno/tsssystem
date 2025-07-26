import { apiClient } from './api-client';

export interface UssdLog {
  id: number;
  session_id: string;
  device_id: string;
  device_name: string | null;
  device_imei: string | null;
  device_imsi: string | null;
  sim_slot: number | null;
  ussd_code: string;
  request_message: string | null;
  response_message: string | null;
  status: string;
  sent_at: string | null;
  received_at: string | null;
  error_message: string | null;
  metadata: any;
  device_group_id: number | null;
  device_group: string | null;
  country_site_id: number | null;
  country_site: string | null;
  created_at: string;
  updated_at: string;
}

export interface UssdLogsResponse {
  data: UssdLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface UssdLogFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  device_id?: string;
  ussd_code?: string;
  device_group_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface UssdLogFilterOptions {
  statuses: string[];
  device_ids: string[];
  ussd_codes: string[];
  device_group_ids: number[];
}

export const ussdLogsService = {
  // Get all USSD logs with filters
  async getUssdLogs(filters: UssdLogFilters = {}): Promise<UssdLogsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<UssdLogsResponse>(`/ussd-logs?${params}`);
    return response;
  },

  // Get a single USSD log by ID
  async getUssdLog(id: number): Promise<UssdLog> {
    const response = await apiClient.get<{ data: UssdLog }>(`/ussd-logs/${id}`);
    return response.data;
  },

  // Get filter options for USSD logs
  async getFilterOptions(): Promise<UssdLogFilterOptions> {
    const response = await apiClient.get<UssdLogFilterOptions>('/ussd-logs/filter-options');
    return response;
  },
}; 