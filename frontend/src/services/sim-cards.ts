import { apiClient } from './api-client';

export interface SimCard {
  id: number;
  slot_index: number;
  subscription_id: number;
  display_name: string;
  carrier_name: string;
  country_iso: string;
  number: string;
  imei: string;
  iccid: string;
  imsi: string;
  network_mcc: string;
  network_mnc: string;
  sim_mcc: string;
  sim_mnc: string;
  network_operator_name: string;
  sim_operator_name: string;
  roaming: boolean;
  signal_strength: number;
  signal_dbm: number;
  signal_type: string;
  rsrp: number;
  rsrq: number;
  rssnr: number;
  cqi: number;
  network_type: string;
  is_active: boolean;
  total_delivered: number;
  total_sent: number;
  total_waiting: number;
  main_balance: number;
  sms_balance: number;
  sms_limit: number;
  device_id: number | null;
  device_name: string | null;
  sitename: string | null;
  device_group_name: string | null;
  created_at: string;
  updated_at: string;
  status_badge_variant: string;
  roaming_badge_variant: string;
  signal_strength_badge_variant: string;
  network_type_badge_variant: string;
  success_rate: number;
  signal_strength_text: string;
  formatted_main_balance: string;
  formatted_sms_balance: string;
  formatted_sms_limit: string;
}

export interface CreateSimCardData {
  slot_index: number;
  subscription_id: number;
  display_name?: string;
  carrier_name?: string;
  country_iso?: string;
  number?: string;
  imei?: string;
  iccid?: string;
  imsi?: string;
  network_mcc?: string;
  network_mnc?: string;
  sim_mcc?: string;
  sim_mnc?: string;
  network_operator_name?: string;
  sim_operator_name?: string;
  roaming?: boolean;
  signal_strength?: number;
  signal_dbm?: number;
  signal_type?: string;
  rsrp?: number;
  rsrq?: number;
  rssnr?: number;
  cqi?: number;
  network_type?: string;
  is_active?: boolean;
  total_delivered?: number;
  total_sent?: number;
  total_waiting?: number;
  main_balance?: number;
  sms_balance?: number;
  sms_limit?: number;
  device_id?: number;
  device_name?: string;
  sitename?: string;
  device_group_name?: string;
}

export interface UpdateSimCardData extends Partial<CreateSimCardData> {}

export interface SimCardsResponse {
  data: SimCard[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface SimCardFilters {
  page?: number;
  per_page?: number;
  search?: string;
  slot_index?: string;
  carrier_name?: string;
  country_iso?: string;
  network_operator_name?: string;
  sim_operator_name?: string;
  roaming?: string;
  is_active?: string;
  network_type?: string;
  sitename?: string;
  device_group_name?: string;
  device_name?: string;
  sms_status?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface SimCardFilterOptions {
  slot_indexes: number[];
  carrier_names: string[];
  country_isos: string[];
  network_operator_names: string[];
  sim_operator_names: string[];
  network_types: string[];
  sitenames: string[];
  device_group_names: string[];
  device_names: string[];
}

export const simCardsService = {
  // Get all SIM cards with filters
  async getSimCards(filters: SimCardFilters = {}): Promise<SimCardsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/sim-cards?${params}`);
    return response.data;
  },

  // Get a single SIM card by ID
  async getSimCard(id: number): Promise<SimCard> {
    const response = await apiClient.get(`/sim-cards/${id}`);
    return response.data.data;
  },

  // Create a new SIM card
  async createSimCard(data: CreateSimCardData): Promise<SimCard> {
    const response = await apiClient.post('/sim-cards', data);
    return response.data.data;
  },

  // Update an existing SIM card
  async updateSimCard(id: number, data: UpdateSimCardData): Promise<SimCard> {
    const response = await apiClient.put(`/sim-cards/${id}`, data);
    return response.data.data;
  },

  // Delete a SIM card
  async deleteSimCard(id: number): Promise<void> {
    await apiClient.delete(`/sim-cards/${id}`);
  },

  // Get filter options for SIM cards
  async getFilterOptions(): Promise<SimCardFilterOptions> {
    const response = await apiClient.get('/sim-cards/filter-options');
    return response.data;
  },
}; 