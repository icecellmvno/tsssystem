import { apiClient } from './api-client';

export interface MccMnc {
  id: number;
  mcc: string;
  mnc: string;
  iso: string;
  country: string;
  country_code: string;
  network: string;
  created_at: string;
  updated_at: string;
}

export interface MccMncCreateRequest {
  mcc: string;
  mnc: string;
  iso: string;
  country: string;
  country_code: string;
  network: string;
}

export interface MccMncUpdateRequest {
  mcc: string;
  mnc: string;
  iso: string;
  country: string;
  country_code: string;
  network: string;
}

export interface MccMncFilterOptions {
  countries: string[];
  networks: string[];
  isos: string[];
}

export interface MccMncListResponse {
  data: MccMnc[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export const mccMncService = {
  // Get all MCC-MNC records with pagination and filters
  getAll: async (params?: {
    search?: string;
    country?: string;
    network?: string;
    iso?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<MccMncListResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.country && params.country !== 'all') searchParams.append('country', params.country);
    if (params?.network && params.network !== 'all') searchParams.append('network', params.network);
    if (params?.iso && params.iso !== 'all') searchParams.append('iso', params.iso);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());

    const response = await apiClient.get<MccMncListResponse>(`/mcc-mnc?${searchParams.toString()}`);
    return response;
  },

  // Get MCC-MNC record by ID
  getById: async (id: number): Promise<MccMnc> => {
    const response = await apiClient.get<MccMnc>(`/mcc-mnc/${id}`);
    return response;
  },

  // Create new MCC-MNC record
  create: async (data: MccMncCreateRequest): Promise<MccMnc> => {
    const response = await apiClient.post<MccMnc>('/mcc-mnc', data);
    return response;
  },

  // Update MCC-MNC record
  update: async (id: number, data: MccMncUpdateRequest): Promise<MccMnc> => {
    const response = await apiClient.put<MccMnc>(`/mcc-mnc/${id}`, data);
    return response;
  },

  // Delete MCC-MNC record
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`/mcc-mnc/${id}`);
  },

  // Bulk delete MCC-MNC records
  bulkDeleteMccMnc: async (ids: number[]): Promise<{ message: string; count: number }> => {
    const response = await apiClient.delete<{ message: string; count: number }>(`/mcc-mnc/bulk-delete?ids=${ids.join(',')}`);
    return response;
  },

  // Get filter options for MCC-MNC
  getFilterOptions: async (): Promise<MccMncFilterOptions> => {
    const response = await apiClient.get<MccMncFilterOptions>('/mcc-mnc/filter-options');
    return response;
  },
}; 