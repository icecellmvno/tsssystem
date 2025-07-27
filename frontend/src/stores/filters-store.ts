import { create } from 'zustand';
import { filtersService } from '@/services/filters';
import type { Filter } from '@/services/filters';

interface PaginatedFilters {
    data: Filter[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface CreateFilterData {
    name: string;
    type: string;
    description?: string;
    conditions?: any;
    is_active?: boolean;
}

interface FiltersState {
    filters: PaginatedFilters;
    currentFilter: Filter | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    fetchFilters: () => Promise<void>;
    fetchFilter: (id: number) => Promise<void>;
    createFilter: (data: CreateFilterData) => Promise<void>;
    updateFilter: (id: number, data: CreateFilterData) => Promise<void>;
    deleteFilter: (id: number) => Promise<void>;
    bulkDeleteFilters: (ids: number[]) => Promise<void>;
    toggleFilterStatus: (id: number) => Promise<void>;
    clearError: () => void;
    clearCurrentFilter: () => void;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
    filters: {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        links: [],
    },
    currentFilter: null,
    isLoading: false,
    error: null,

    fetchFilters: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await filtersService.getFilters();
            // Transform the response to match PaginatedFilters interface
            const filters: PaginatedFilters = {
                data: response.filters,
                current_page: 1,
                last_page: 1,
                per_page: response.filters.length,
                total: response.filters.length,
                links: [],
            };
            set({ filters, isLoading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch filters', 
                isLoading: false 
            });
            throw error;
        }
    },

    fetchFilter: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const filter = await filtersService.getFilter(id);
            set({ currentFilter: filter, isLoading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch filter', 
                isLoading: false 
            });
            throw error;
        }
    },

    createFilter: async (data: CreateFilterData) => {
        set({ isLoading: true, error: null });
        try {
            await filtersService.createFilter(data);
            // Refresh the filters list
            await get().fetchFilters();
            set({ isLoading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to create filter', 
                isLoading: false 
            });
            throw error;
        }
    },

    updateFilter: async (id: number, data: CreateFilterData) => {
        set({ isLoading: true, error: null });
        try {
            const updatedFilter = await filtersService.updateFilter(id, data);
            set({ currentFilter: updatedFilter, isLoading: false });
            // Refresh the filters list
            await get().fetchFilters();
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to update filter', 
                isLoading: false 
            });
            throw error;
        }
    },

    deleteFilter: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            await filtersService.deleteFilter(id);
            // Refresh the filters list
            await get().fetchFilters();
            set({ isLoading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to delete filter', 
                isLoading: false 
            });
            throw error;
        }
    },

    bulkDeleteFilters: async (ids: number[]) => {
        set({ isLoading: true, error: null });
        try {
            await filtersService.bulkDeleteFilters(ids);
            // Refresh the filters list
            await get().fetchFilters();
            set({ isLoading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to delete filters', 
                isLoading: false 
            });
            throw error;
        }
    },

    toggleFilterStatus: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
            const updatedFilter = await filtersService.toggleFilterStatus(id);
            set({ currentFilter: updatedFilter, isLoading: false });
            // Refresh the filters list
            await get().fetchFilters();
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to toggle filter status', 
                isLoading: false 
            });
            throw error;
        }
    },

    clearError: () => {
        set({ error: null });
    },

    clearCurrentFilter: () => {
        set({ currentFilter: null });
    },
})); 