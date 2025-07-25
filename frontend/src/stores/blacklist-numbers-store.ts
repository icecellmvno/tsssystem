import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { blacklistNumbersService, type BlacklistNumber, type BlacklistNumbersFilters, type PaginatedResponse } from '@/services/blacklist-numbers';

interface BlacklistNumbersState {
    // Data
    blacklistNumbers: BlacklistNumber[];
    currentBlacklistNumber: BlacklistNumber | null;
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    } | null;
    
    // Loading states
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    
    // Filters
    filters: BlacklistNumbersFilters;
    
    // Error handling
    error: string | null;
    
    // Actions
    setFilters: (filters: Partial<BlacklistNumbersFilters>) => void;
    clearFilters: () => void;
    setError: (error: string | null) => void;
    
    // CRUD operations
    fetchBlacklistNumbers: (filters?: BlacklistNumbersFilters) => Promise<void>;
    fetchBlacklistNumber: (id: number) => Promise<void>;
    createBlacklistNumber: (data: any) => Promise<BlacklistNumber | null>;
    updateBlacklistNumber: (id: number, data: any) => Promise<BlacklistNumber | null>;
    deleteBlacklistNumber: (id: number) => Promise<boolean>;
    bulkDeleteBlacklistNumbers: (ids: number[]) => Promise<boolean>;
    
    // Import/Export operations
    importFile: (file: File) => Promise<any>;
    importPaste: (lines: string) => Promise<any>;
    exportData: (filters?: BlacklistNumbersFilters) => Promise<Blob | null>;
    downloadTemplate: () => Promise<Blob | null>;
    
    // Utility
    clearCurrentBlacklistNumber: () => void;
    reset: () => void;
}

const initialState = {
    blacklistNumbers: [],
    currentBlacklistNumber: null,
    pagination: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    filters: {
        search: '',
        type: 'all',
        sort_by: 'created_at',
        sort_order: 'desc',
        page: 1,
    },
    error: null,
};

export const useBlacklistNumbersStore = create<BlacklistNumbersState>()(
    devtools(
        (set, get) => ({
            ...initialState,
            
            setFilters: (filters) => {
                set((state) => ({
                    filters: { ...state.filters, ...filters },
                }));
            },
            
            clearFilters: () => {
                set((state) => ({
                    filters: initialState.filters,
                }));
            },
            
            setError: (error) => {
                set({ error });
            },
            
            fetchBlacklistNumbers: async (filters) => {
                const currentFilters = filters || get().filters;
                
                set({ isLoading: true, error: null });
                
                try {
                    const response = await blacklistNumbersService.getAll(currentFilters);
                    set({
                        blacklistNumbers: response.data || [],
                        pagination: {
                            current_page: response.current_page,
                            last_page: response.last_page,
                            per_page: response.per_page,
                            total: response.total,
                        },
                    });
                } catch (error: any) {
                    set({ error: error.message || 'Failed to fetch blacklist numbers' });
                } finally {
                    set({ isLoading: false });
                }
            },
            
            fetchBlacklistNumber: async (id) => {
                set({ isLoading: true, error: null });
                
                try {
                    const blacklistNumber = await blacklistNumbersService.getById(id);
                    set({ currentBlacklistNumber: blacklistNumber });
                } catch (error: any) {
                    set({ error: error.message || 'Failed to fetch blacklist number' });
                } finally {
                    set({ isLoading: false });
                }
            },
            
            createBlacklistNumber: async (data) => {
                set({ isCreating: true, error: null });
                
                try {
                    const newBlacklistNumber = await blacklistNumbersService.create(data);
                    set((state) => ({
                        blacklistNumbers: [newBlacklistNumber, ...state.blacklistNumbers],
                    }));
                    return newBlacklistNumber;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to create blacklist number' });
                    return null;
                } finally {
                    set({ isCreating: false });
                }
            },
            
            updateBlacklistNumber: async (id, data) => {
                set({ isUpdating: true, error: null });
                
                try {
                    const updatedBlacklistNumber = await blacklistNumbersService.update(id, data);
                    set((state) => ({
                        blacklistNumbers: state.blacklistNumbers.map((item) =>
                            item.id === id ? updatedBlacklistNumber : item
                        ),
                        currentBlacklistNumber: state.currentBlacklistNumber?.id === id 
                            ? updatedBlacklistNumber 
                            : state.currentBlacklistNumber,
                    }));
                    return updatedBlacklistNumber;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to update blacklist number' });
                    return null;
                } finally {
                    set({ isUpdating: false });
                }
            },
            
            deleteBlacklistNumber: async (id) => {
                set({ isDeleting: true, error: null });
                
                try {
                    await blacklistNumbersService.delete(id);
                    set((state) => ({
                        blacklistNumbers: state.blacklistNumbers.filter((item) => item.id !== id),
                        currentBlacklistNumber: state.currentBlacklistNumber?.id === id 
                            ? null 
                            : state.currentBlacklistNumber,
                    }));
                    return true;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to delete blacklist number' });
                    return false;
                } finally {
                    set({ isDeleting: false });
                }
            },
            
            bulkDeleteBlacklistNumbers: async (ids) => {
                set({ isDeleting: true, error: null });
                
                try {
                    await blacklistNumbersService.bulkDelete(ids);
                    set((state) => ({
                        blacklistNumbers: state.blacklistNumbers.filter((item) => !ids.includes(item.id)),
                    }));
                    return true;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to delete blacklist numbers' });
                    return false;
                } finally {
                    set({ isDeleting: false });
                }
            },
            
            importFile: async (file) => {
                set({ isLoading: true, error: null });
                
                try {
                    const result = await blacklistNumbersService.importFile(file);
                    // Refresh the list after import
                    await get().fetchBlacklistNumbers();
                    return result;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to import file' });
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },
            
            importPaste: async (lines) => {
                set({ isLoading: true, error: null });
                
                try {
                    const result = await blacklistNumbersService.importPaste(lines);
                    // Refresh the list after import
                    await get().fetchBlacklistNumbers();
                    return result;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to import pasted data' });
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },
            
            exportData: async (filters) => {
                set({ isLoading: true, error: null });
                
                try {
                    const blob = await blacklistNumbersService.export(filters);
                    return blob;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to export data' });
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },
            
            downloadTemplate: async () => {
                set({ isLoading: true, error: null });
                
                try {
                    const blob = await blacklistNumbersService.downloadTemplate();
                    return blob;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to download template' });
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },
            
            clearCurrentBlacklistNumber: () => {
                set({ currentBlacklistNumber: null });
            },
            
            reset: () => {
                set(initialState);
            },
        }),
        {
            name: 'blacklist-numbers-store',
        }
    )
); 