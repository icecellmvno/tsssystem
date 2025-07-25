import { apiClient } from './api-client';
import { useState, useEffect } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CountrySite {
  id: number;
  name: string;
  country_phone_code: string;
  manager_user: number;
  operator_user: number;
  created_at: string;
  updated_at: string;
}

export interface CountrySiteCreateRequest {
  name: string;
  country_phone_code: string;
  manager_user: number;
  operator_user: number;
}

export interface CountrySiteUpdateRequest {
  name: string;
  country_phone_code: string;
  manager_user: number;
  operator_user: number;
}

export interface CountrySiteFilters {
  search?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}

export interface CountrySiteResponse {
  data: CountrySite[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  links: Array<{
    url: string;
    label: string;
    active: boolean;
  }>;
}

class CountrySitesService {
  async getAll(filters?: CountrySiteFilters): Promise<CountrySiteResponse> {
    return apiClient.get<CountrySiteResponse>('/country-sites', filters);
  }

  async getById(id: number): Promise<CountrySite> {
    return apiClient.get<CountrySite>(`/country-sites/${id}`);
  }

  async create(data: CountrySiteCreateRequest): Promise<CountrySite> {
    return apiClient.post<CountrySite>('/country-sites', data);
  }

  async update(id: number, data: CountrySiteUpdateRequest): Promise<CountrySite> {
    return apiClient.put<CountrySite>(`/country-sites/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/country-sites/${id}`);
  }

  async getUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  }
}

export const countrySitesService = new CountrySitesService();

// Custom hook for country sites
export const useCountrySites = (filters: CountrySiteFilters) => {
  const [data, setData] = useState<CountrySiteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await countrySitesService.getAll(filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch country sites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters.search, filters.sort_by, filters.sort_order, filters.page]);

  const deleteCountrySite = async (id: number) => {
    try {
      await countrySitesService.delete(id);
      // Refetch data after deletion
      const response = await countrySitesService.getAll(filters);
      setData(response);
    } catch (err) {
      throw err;
    }
  };

  return { data, isLoading, error, deleteCountrySite };
}; 