import { apiClient } from './api-client';

export interface SmsRoutingItem {
  id: number;
  name: string;
  description: string;
  source_type: 'smpp' | 'http';
  direction: 'inbound' | 'outbound';
  system_id: string | null;
  destination_address: string | null;
  target_type: 'http' | 'device_group' | 'smpp';
  target_url: string | null;
  device_group_id: number | null;
  target_system_id: string | null;
  user_id: number | null;
  is_active: boolean;
  priority: number;
  conditions: string | null;
  created_at: string;
  updated_at: string;
  status_badge_variant: "default" | "secondary" | "destructive" | "outline";
  source_type_badge_variant: "default" | "secondary" | "destructive" | "outline";
  direction_badge_variant: "default" | "secondary" | "destructive" | "outline";
  target_type_badge_variant: "default" | "secondary" | "destructive" | "outline";
  source_display_name: string;
  target_display_name: string;
  routing_summary: string;
  device_group?: { id: number; name: string };
  user?: { id: number; username: string };
}

export interface SmsRoutingsListResponse {
  data: SmsRoutingItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SmsRoutingsFilterOptions {
  device_groups: Array<{ id: number; name: string; queue_name: string | null }>;
  smpp_users: string[];
  users: Array<{ id: number; username: string; firstname: string; lastname: string }>;
}

export interface SmsRoutingsFilters {
  search?: string;
  source_type?: string;
  direction?: string;
  target_type?: string;
  is_active?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const smsRoutingsService = {
  // Get all SMS routings with pagination and filters
  getAll: async (params?: SmsRoutingsFilters): Promise<SmsRoutingsListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.source_type && params.source_type !== 'all') searchParams.append('source_type', params.source_type);
    if (params?.direction && params.direction !== 'all') searchParams.append('direction', params.direction);
    if (params?.target_type && params.target_type !== 'all') searchParams.append('target_type', params.target_type);
    if (params?.is_active && params.is_active !== 'all') searchParams.append('is_active', params.is_active);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());

    const response = await apiClient.get<SmsRoutingsListResponse>(`/smpp-routings?${searchParams.toString()}`);
    return response;
  },

  // Get SMS routing by ID
  getById: async (id: number): Promise<SmsRoutingItem> => {
    const response = await apiClient.get<SmsRoutingItem>(`/smpp-routings/${id}`);
    return response;
  },

  // Create SMS routing
  create: async (data: Partial<SmsRoutingItem>): Promise<SmsRoutingItem> => {
    const response = await apiClient.post<SmsRoutingItem>('/smpp-routings', data);
    return response;
  },

  // Update SMS routing
  update: async (id: number, data: Partial<SmsRoutingItem>): Promise<SmsRoutingItem> => {
    const response = await apiClient.put<SmsRoutingItem>(`/smpp-routings/${id}`, data);
    return response;
  },

  // Delete SMS routing
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`/smpp-routings/${id}`);
  },

  // Get filter options
  getFilterOptions: async (): Promise<SmsRoutingsFilterOptions> => {
    const response = await apiClient.get<SmsRoutingsFilterOptions>('/smpp-routings/filter-options');
    return response;
  },
}; 