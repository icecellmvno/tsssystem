import { apiClient } from './api-client';

export interface SimCard {
  id: number;
  imei: string;
  iccid: string;
  msisdn: string;
  operator: string;
  country: string;
  status: string;
  balance: number;
  data_usage: number;
  sms_usage: number;
  created_at: string;
  updated_at: string;
  device_id?: number;
  device_name?: string;
  display_name?: string;
  slot_index?: number;
  subscription_id?: string;
  carrier_name?: string;
  country_iso?: string;
  number?: string;
  is_active?: boolean;
  network_type?: string;
  roaming?: boolean;
  network_operator_name?: string;
  sim_operator_name?: string;
  network_mcc?: string;
  network_mnc?: string;
  imsi?: string;
  sim_mcc?: string;
  sim_mnc?: string;
  signal_strength?: number;
  signal_dbm?: number;
  signal_type?: string;
  rsrp?: number;
  rsrq?: number;
  rssnr?: number;
  cqi?: number;
  formatted_main_balance?: string;
  formatted_sms_balance?: string;
  formatted_sms_limit?: string;
  total_sent?: number;
  total_delivered?: number;
  total_waiting?: number;
  success_rate?: number;
  sitename?: string;
  device_group_name?: string;
  main_balance?: number;
  sms_balance?: number;
  sms_limit?: number;
}

export interface CreateSimCardData {
  imei: string;
  iccid: string;
  msisdn: string;
  operator: string;
  country: string;
  status: string;
  balance: number;
  data_usage: number;
  sms_usage: number;
  device_id?: number;
  display_name?: string;
  slot_index?: number;
  subscription_id?: string;
  carrier_name?: string;
  country_iso?: string;
  number?: string;
  is_active?: boolean;
  network_type?: string;
  roaming?: boolean;
  network_operator_name?: string;
  sim_operator_name?: string;
  network_mcc?: string;
  network_mnc?: string;
  imsi?: string;
  sim_mcc?: string;
  sim_mnc?: string;
  signal_strength?: number;
  signal_dbm?: number;
  signal_type?: string;
  rsrp?: number;
  rsrq?: number;
  rssnr?: number;
  cqi?: number;
  formatted_main_balance?: string;
  formatted_sms_balance?: string;
  formatted_sms_limit?: string;
  total_sent?: number;
  total_delivered?: number;
  total_waiting?: number;
  success_rate?: number;
  sitename?: string;
  device_group_name?: string;
  main_balance?: number;
  sms_balance?: number;
  sms_limit?: number;
}

export interface UpdateSimCardData extends Partial<CreateSimCardData> {}

export const simCardsService = {
  async getSimCards(): Promise<{ sim_cards: SimCard[] }> {
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