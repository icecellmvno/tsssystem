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
}

export const simCardsService = {
  async getSimCards(): Promise<{ sim_cards: SimCard[] }> {
    return apiClient.get('/sim-cards');
  },

  async deleteSimCard(id: number): Promise<void> {
    return apiClient.delete(`/sim-cards/${id}`);
  },
}; 