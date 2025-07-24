import { create } from 'zustand';
import { deviceGroupService, type DeviceGroup, type DeviceGroupFilters } from '@/services/device-groups';
import { sitenamesService, type Sitename } from '@/services/sitenames';
import { useAuthStore } from '@/stores/auth-store';

interface WebsocketConfig {
  websocket_url: string;
  device_websocket_url: string;
  api_key: string;
  queue_name: string;
}

interface DeviceGroupsState {
  // Device Groups
  deviceGroups: DeviceGroup[];
  selectedDeviceGroup: DeviceGroup | null;
  loading: boolean;
  error: string | null;
  
  // Sitenames
  sitenames: Sitename[];
  sitenamesLoading: boolean;
  sitenamesError: string | null;
  
  // Websocket Config
  websocketConfig: WebsocketConfig | null;
  websocketConfigLoading: boolean;
  websocketConfigError: string | null;
  
  // Actions
  loadDeviceGroups: (filters?: DeviceGroupFilters) => Promise<void>;
  loadSitenames: () => Promise<void>;
  loadWebsocketConfig: () => Promise<void>;
  getDeviceGroup: (id: number) => Promise<DeviceGroup | null>;
  createDeviceGroup: (data: any) => Promise<void>;
  updateDeviceGroup: (id: number, data: any) => Promise<void>;
  deleteDeviceGroup: (id: number) => Promise<void>;
  setSelectedDeviceGroup: (deviceGroup: DeviceGroup | null) => void;
  clearError: () => void;
}

export const useDeviceGroupsStore = create<DeviceGroupsState>((set, get) => ({
  // Initial state
  deviceGroups: [],
  selectedDeviceGroup: null,
  loading: false,
  error: null,
  sitenames: [],
  sitenamesLoading: false,
  sitenamesError: null,
  websocketConfig: null,
  websocketConfigLoading: false,
  websocketConfigError: null,

  // Load device groups
  loadDeviceGroups: async (filters?: DeviceGroupFilters) => {
    try {
      set({ loading: true, error: null });
      const response = await deviceGroupService.getDeviceGroups(filters || {});
      set({ deviceGroups: response.data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load device groups', 
        loading: false 
      });
    }
  },

  // Load sitenames
  loadSitenames: async () => {
    try {
      set({ sitenamesLoading: true, sitenamesError: null });
      const response = await sitenamesService.getAll();
      set({ sitenames: response.data, sitenamesLoading: false });
    } catch (error) {
      set({ 
        sitenamesError: error instanceof Error ? error.message : 'Failed to load sitenames', 
        sitenamesLoading: false 
      });
    }
  },

  // Load websocket config
  loadWebsocketConfig: async () => {
    try {
      set({ websocketConfigLoading: true, websocketConfigError: null });
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/websocket-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load websocket config');
      }
      const data = await response.json();
      set({ websocketConfig: data.data, websocketConfigLoading: false });
    } catch (error) {
      set({ 
        websocketConfigError: error instanceof Error ? error.message : 'Failed to load websocket config', 
        websocketConfigLoading: false 
      });
    }
  },

  // Get single device group
  getDeviceGroup: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const deviceGroup = await deviceGroupService.getDeviceGroup(id);
      set({ selectedDeviceGroup: deviceGroup, loading: false });
      return deviceGroup;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load device group', 
        loading: false 
      });
      return null;
    }
  },

  // Create device group
  createDeviceGroup: async (data: any) => {
    try {
      set({ loading: true, error: null });
      await deviceGroupService.createDeviceGroup(data);
      // Reload device groups after creation
      await get().loadDeviceGroups();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create device group', 
        loading: false 
      });
      throw error;
    }
  },

  // Update device group
  updateDeviceGroup: async (id: number, data: any) => {
    try {
      set({ loading: true, error: null });
      await deviceGroupService.updateDeviceGroup(id, data);
      // Reload device groups after update
      await get().loadDeviceGroups();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update device group', 
        loading: false 
      });
      throw error;
    }
  },

  // Delete device group
  deleteDeviceGroup: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await deviceGroupService.deleteDeviceGroup(id);
      // Reload device groups after deletion
      await get().loadDeviceGroups();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete device group', 
        loading: false 
      });
      throw error;
    }
  },

  // Set selected device group
  setSelectedDeviceGroup: (deviceGroup: DeviceGroup | null) => {
    set({ selectedDeviceGroup: deviceGroup });
  },

  // Clear error
  clearError: () => {
    set({ error: null, sitenamesError: null });
  },
})); 