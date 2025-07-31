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
  device_id?: number;
  device_name?: string;
  country_site?: string;
  device_group_name?: string;
  device_model?: string;
  sim_card_status?: string;
  created_at: string;
  updated_at: string;
  // Enhanced fields from backend
  status_badge_variant?: string;
  roaming_badge_variant?: string;
  signal_strength_badge_variant?: string;
  network_type_badge_variant?: string;
  success_rate?: number;
  signal_strength_text?: string;
  formatted_main_balance?: string;
  formatted_sms_balance?: string;
  formatted_sms_limit?: string;
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
  main_balance?: number;
  sms_balance?: number;
  sms_limit?: number;
  device_id?: number;
  device_name?: string;
  country_site?: string;
  device_group_name?: string;
}

export interface UpdateSimCardData extends Partial<CreateSimCardData> {}

export const simCardsService = {
  async getSimCards(): Promise<{ data: SimCard[] }> {
    return apiClient.get('/sim-cards');
  },

  async getSimCard(id: number): Promise<SimCard> {
    return apiClient.get(`/sim-cards/${id}`);
  },

  async createSimCard(data: CreateSimCardData): Promise<SimCard> {
    return apiClient.post('/sim-cards', data);
  },

  async updateSimCard(id: number, data: UpdateSimCardData): Promise<SimCard> {
    return apiClient.put(`/sim-cards/${id}`, data);
  },

  async deleteSimCard(id: number): Promise<void> {
    return apiClient.delete(`/sim-cards/${id}`);
  },
}; 