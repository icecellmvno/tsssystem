import { apiClient } from './api-client';

export interface DeviceGroupConfig {
  id: number;
  sms_routing_id: number;
  device_group_id: number;
  priority: number;
  total_sms_count: number;
  
  // Device Selection Strategy
  device_selection_strategy: string;
  target_device_ids?: string; // JSON array of device IMEIs
  
  // SIM Card Configuration
  sim_slot_preference: number;
  sim_card_selection_strategy: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  device_group?: {
    id: number;
    name: string;
    queue_name?: string;
    priority?: number;
    total_sms?: number;
  };
}

export interface SmppRoutingItem {
  id: number;
  name: string;
  description: string;
  source_type: string;
  direction: string;
  system_id?: string;
  destination_address?: string;
  target_type: string;
  device_group_ids?: string; // JSON array of device group IDs (legacy)
  user_id?: number;
  is_active: boolean;
  priority: number;
  total_sms_count?: number;
  conditions?: string;
  
  // Device Selection Strategy (legacy - now in DeviceGroupConfig)
  device_selection_strategy?: string;
  target_device_ids?: string; // JSON array of device IMEIs
  max_devices_per_message?: number;
  
  // SIM Card Configuration (legacy - now in DeviceGroupConfig)
  sim_slot_preference?: number;
  sim_card_selection_strategy?: string;
  
  created_at: string;
  updated_at: string;
  
  // Computed fields from backend
  status_badge_variant: "default" | "destructive" | "outline" | "secondary";
  source_type_badge_variant: "default" | "destructive" | "outline" | "secondary";
  direction_badge_variant: "default" | "destructive" | "outline" | "secondary";
  target_type_badge_variant: "default" | "destructive" | "outline" | "secondary";
  source_display_name: string;
  target_display_name: string;
  routing_summary: string;
  
  // Relations
  user?: {
    id: number;
    username: string;
  };
  
  // Device Group Configurations (new structure)
  device_group_configs?: DeviceGroupConfig[];
}

export interface SmppRoutingsListResponse {
  data: SmppRoutingItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SmppRoutingFilterOptions {
  device_groups: Array<{
    id: number;
    name: string;
    queue_name: string;
    priority?: number;
    total_sms?: number;
  }>;
  smpp_users: string[];
  users: Array<{
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  }>;
}

export interface SmppRoutingCreateData {
  name: string;
  description?: string;
  source_type: string;
  direction: string;
  system_id?: string;
  destination_address?: string;
  target_type: string;
  device_group_ids?: number[]; // Array of device group IDs (legacy)
  user_id?: number;
  priority: number;
  total_sms_count?: number;
  is_active: boolean;
  conditions?: string;
  
  // Device Selection Strategy (legacy - now in DeviceGroupConfig)
  device_selection_strategy?: string;
  target_device_ids?: string[]; // Array of device IMEIs
  
  // SIM Card Configuration (legacy - now in DeviceGroupConfig)
  sim_slot_preference?: number;
  sim_card_selection_strategy?: string;
  
  // Device Group Configurations (new structure)
  device_group_configs?: {
    device_group_id: number;
    priority: number;
    total_sms_count: number;
    device_selection_strategy: string;
    target_device_ids?: string[];
    sim_slot_preference: number;
    sim_card_selection_strategy: string;
  }[];
}

export interface SmppRoutingUpdateData extends Partial<SmppRoutingCreateData> {}

export interface SmppRoutingFilters {
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

class SmppRoutingsService {
  private baseUrl = '/smpp-routings';

  async getAll(filters?: SmppRoutingFilters): Promise<SmppRoutingsListResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<SmppRoutingsListResponse>(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getById(id: number): Promise<SmppRoutingItem> {
    const response = await apiClient.get<{ data: SmppRoutingItem }>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: SmppRoutingCreateData): Promise<SmppRoutingItem> {
    const response = await apiClient.post<SmppRoutingItem>(this.baseUrl, data);
    return response;
  }

  async update(id: number, data: SmppRoutingUpdateData): Promise<SmppRoutingItem> {
    const response = await apiClient.put<{ data: SmppRoutingItem }>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getFilterOptions(): Promise<SmppRoutingFilterOptions> {
    const response = await apiClient.get<SmppRoutingFilterOptions>(`${this.baseUrl}/filter-options`);
    return response;
  }
}

export const smppRoutingsService = new SmppRoutingsService(); 