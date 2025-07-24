import { apiClient } from './api-client';
import { useState, useEffect } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Sitename {
  id: number;
  name: string;
  manager_user: number;
  operator_user: number;
  created_at: string;
  updated_at: string;
}

export interface SitenameCreateRequest {
  name: string;
  manager_user: number;
  operator_user: number;
}

export interface SitenameUpdateRequest {
  name: string;
  manager_user: number;
  operator_user: number;
}

export interface SitenameFilters {
  search?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}

export interface SitenameResponse {
  data: Sitename[];
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

class SitenamesService {
  async getAll(filters?: SitenameFilters): Promise<SitenameResponse> {
    return apiClient.get<SitenameResponse>('/sitenames', filters);
  }

  async getById(id: number): Promise<Sitename> {
    return apiClient.get<Sitename>(`/sitenames/${id}`);
  }

  async create(data: SitenameCreateRequest): Promise<Sitename> {
    return apiClient.post<Sitename>('/sitenames', data);
  }

  async update(id: number, data: SitenameUpdateRequest): Promise<Sitename> {
    return apiClient.put<Sitename>(`/sitenames/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/sitenames/${id}`);
  }

  async getUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  }
}

export const sitenamesService = new SitenamesService();

// Custom hook for sitenames
export const useSitenames = (filters: SitenameFilters) => {
  const [data, setData] = useState<SitenameResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await sitenamesService.getAll(filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sitenames');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters.search, filters.sort_by, filters.sort_order, filters.page]);

  const deleteSitename = async (id: number) => {
    try {
      await sitenamesService.delete(id);
      // Refetch data after deletion
      const response = await sitenamesService.getAll(filters);
      setData(response);
    } catch (err) {
      throw err;
    }
  };

  return { data, isLoading, error, deleteSitename };
}; 