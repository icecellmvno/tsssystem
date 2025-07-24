import { apiClient } from './api-client';

export interface BlacklistNumber {
    id: number;
    number: string;
    type: 'sms' | 'manual';
    reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateBlacklistNumberData {
    number: string;
    type: 'sms' | 'manual';
    reason?: string;
}

export interface UpdateBlacklistNumberData {
    number?: string;
    type?: 'sms' | 'manual';
    reason?: string;
}

export interface BlacklistNumbersFilters {
    search?: string;
    type?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

export const blacklistNumbersService = {
    // Get all blacklist numbers with pagination and filters
    async getAll(filters: BlacklistNumbersFilters = {}): Promise<PaginatedResponse<BlacklistNumber>> {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        if (filters.page) params.append('page', filters.page.toString());

        const response = await apiClient.get(`/api/blacklist-numbers?${params.toString()}`);
        return response.data;
    },

    // Get a single blacklist number by ID
    async getById(id: number): Promise<BlacklistNumber> {
        const response = await apiClient.get(`/api/blacklist-numbers/${id}`);
        return response.data;
    },

    // Create a new blacklist number
    async create(data: CreateBlacklistNumberData): Promise<BlacklistNumber> {
        const response = await apiClient.post('/api/blacklist-numbers', data);
        return response.data;
    },

    // Update an existing blacklist number
    async update(id: number, data: UpdateBlacklistNumberData): Promise<BlacklistNumber> {
        const response = await apiClient.put(`/api/blacklist-numbers/${id}`, data);
        return response.data;
    },

    // Delete a blacklist number
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/api/blacklist-numbers/${id}`);
    },

    // Bulk delete multiple blacklist numbers
    async bulkDelete(ids: number[]): Promise<void> {
        await apiClient.post('/api/blacklist-numbers/bulk-delete', { ids });
    },

    // Import blacklist numbers from file
    async importFile(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await apiClient.post('/api/blacklist-numbers/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Import blacklist numbers from pasted text
    async importPaste(lines: string): Promise<any> {
        const response = await apiClient.post('/api/blacklist-numbers/bulk-paste', { lines });
        return response.data;
    },

    // Download template for import
    async downloadTemplate(): Promise<Blob> {
        const response = await apiClient.get('/api/blacklist-numbers/template', {
            responseType: 'blob',
        });
        return response.data;
    },

    // Export blacklist numbers
    async export(filters: BlacklistNumbersFilters = {}): Promise<Blob> {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);

        const response = await apiClient.get(`/api/blacklist-numbers/export?${params.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },
}; 