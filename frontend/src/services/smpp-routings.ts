import { apiClient } from './api-client';

export interface SmppRoutingItem {
  id: number;
  name: string;
  description: string;
  source_type: string;
  direction: string;
  system_id?: string;
  destination_address?: string;
  target_type: string;
  device_group_ids?: string; // JSON array of device group IDs
  user_id?: number;
  is_active: boolean;
  priority: number;
  conditions?: string;
  
  // Device Selection Strategy
  device_selection_strategy?: string;
  target_device_ids?: string; // JSON array of device IMEIs
  max_devices_per_message?: number;
  
  // SIM Card Configuration
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
  device_group_ids?: number[]; // Array of device group IDs
  user_id?: number;
  priority: number;
  is_active: boolean;
  conditions?: string;
  
  // Device Selection Strategy
  device_selection_strategy?: string;
  target_device_ids?: string[]; // Array of device IMEIs
  max_devices_per_message?: number;
  
  // SIM Card Configuration
  sim_slot_preference?: number;
  sim_card_selection_strategy?: string;
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
    const response = await apiClient.get<SmppRoutingItem>(`${this.baseUrl}/${id}`);
    return response;
  }

  async create(data: SmppRoutingCreateData): Promise<SmppRoutingItem> {
    const response = await apiClient.post<SmppRoutingItem>(this.baseUrl, data);
    return response;
  }

  async update(id: number, data: SmppRoutingUpdateData): Promise<SmppRoutingItem> {
    const response = await apiClient.put<SmppRoutingItem>(`${this.baseUrl}/${id}`, data);
    return response;
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