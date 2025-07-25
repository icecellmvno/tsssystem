import { apiClient } from './api-client';
import type { FilterItem, PaginatedFilters, CreateFilterData, UpdateFilterData } from '@/types/filters';

export const filtersService = {
    // Get all filters with pagination and filters
    getFilters: async (params?: Record<string, any>): Promise<PaginatedFilters> => {
        return apiClient.get<PaginatedFilters>('/filters', params);
    },

    // Get a single filter by ID
    getFilter: async (id: number): Promise<FilterItem> => {
        return apiClient.get<FilterItem>(`/filters/${id}`);
    },

    // Create a new filter
    createFilter: async (data: CreateFilterData): Promise<FilterItem> => {
        return apiClient.post<FilterItem>('/filters', data);
    },

    // Update an existing filter
    updateFilter: async (id: number, data: CreateFilterData): Promise<FilterItem> => {
        return apiClient.put<FilterItem>(`/filters/${id}`, data);
    },

    // Delete a filter
    deleteFilter: async (id: number): Promise<void> => {
        return apiClient.delete(`/filters/${id}`);
    },

    // Bulk delete filters
    bulkDeleteFilters: async (ids: number[]): Promise<void> => {
        return apiClient.delete('/filters/bulk', { ids });
    },

    // Toggle filter status
    toggleFilterStatus: async (id: number): Promise<FilterItem> => {
        return apiClient.patch<FilterItem>(`/filters/${id}/toggle`);
    },
}; 