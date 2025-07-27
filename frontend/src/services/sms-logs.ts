import { apiClient } from './api-client';

export interface SmsLogItem {
  id: number;
  message_id: string;
  device_id: string | null;
  device_name: string | null;
  device_imei: string | null;
  device_imsi: string | null;
  simcard_name: string | null;
  sim_slot: number | null;
  simcard_number: string | null;
  simcard_iccid: string | null;
  source_addr: string | null;
  source_connector: string | null;
  source_user: string | null;
  destination_addr: string | null;
  message: string | null;
  message_length: number | null;
  direction: string | null;
  priority: string | null;
  status: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  delivery_report_status: string | null;
  delivery_report_received_at: string | null;
  received_at: string | null;
  error_message: string | null;
  device_group_id: number | null;
  device_group: string | null;
  country_site_id: number | null;
  country_site: string | null;
  campaign_id: string | null;
  batch_id: string | null;
  queued_at: string | null;
  metadata: string | null;
  total_cost: string | null;
  currency: string | null;
  smpp_sent: boolean | null;
  delivery_report_requested: boolean | null;
  retry_count: number | null;
  max_retries: number | null;
  created_at: string;
  updated_at: string;
}

export interface SmsLogsListResponse {
  data: SmsLogItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: any[];
}

export interface SmsLogsFilterOptions {
  statuses: string[];
  deviceNames: string[];
  simcardNames: string[];
  simSlots: number[];
  countrySites: string[];
  deviceGroups: string[];
  sourceUsernames: string[];
}

export interface SmsLogsFilters {
  search?: string;
  status?: string;
  smpp_sent?: string;
  source_addr?: string;
  destination_addr?: string;
  device_id?: string;
  device_name?: string;
  simcard_name?: string;
  sim_slot?: string;
  country_site?: string;
  device_group?: string;
  source_username?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const smsLogsService = {
  // Get all SMS logs with pagination and filters
  getAll: async (params?: SmsLogsFilters): Promise<SmsLogsListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.smpp_sent && params.smpp_sent !== 'all') searchParams.append('smpp_sent', params.smpp_sent);
    if (params?.source_addr) searchParams.append('source_addr', params.source_addr);
    if (params?.destination_addr) searchParams.append('destination_addr', params.destination_addr);
    if (params?.device_id) searchParams.append('device_id', params.device_id);
    if (params?.device_name && params.device_name !== 'all') searchParams.append('device_name', params.device_name);
    if (params?.simcard_name && params.simcard_name !== 'all') searchParams.append('simcard_name', params.simcard_name);
    if (params?.sim_slot && params.sim_slot !== 'all') searchParams.append('sim_slot', params.sim_slot);
    if (params?.country_site && params.country_site !== 'all') searchParams.append('country_site', params.country_site);
    if (params?.device_group && params.device_group !== 'all') searchParams.append('device_group', params.device_group);
    if (params?.source_username && params.source_username !== 'all') searchParams.append('source_username', params.source_username);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());

    const response = await apiClient.get<SmsLogsListResponse>(`/sms-logs?${searchParams.toString()}`);
    return response;
  },

  // Get SMS log by ID
  getById: async (id: number): Promise<SmsLogItem> => {
    const response = await apiClient.get<SmsLogItem>(`/sms-logs/${id}`);
    return response;
  },

  // Get filter options
  getFilterOptions: async (): Promise<SmsLogsFilterOptions> => {
    const response = await apiClient.get<SmsLogsFilterOptions>('/sms-logs/filter-options');
    return response;
  },

  // Delete SMS log
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`/sms-logs/${id}`);
  },

  // Bulk delete SMS logs
  bulkDelete: async (ids: number[]): Promise<{ message: string; count: number }> => {
    const response = await apiClient.post<{ message: string; count: number }>('/sms-logs/bulk-delete', { ids });
    return response;
  },
}; 