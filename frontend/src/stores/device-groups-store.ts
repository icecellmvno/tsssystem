import { create } from 'zustand';
import { countrySitesService, type CountrySite } from '@/services/countrysites';
import { deviceGroupService, type DeviceGroup, type DeviceGroupCreateRequest, type DeviceGroupUpdateRequest } from '@/services/device-groups';
import { toast } from 'sonner';

interface DeviceGroupsState {
  // Device Groups
  deviceGroups: DeviceGroup[];
  deviceGroupsLoading: boolean;
  deviceGroupsError: string | null;
  currentDeviceGroup: DeviceGroup | null;
  currentDeviceGroupLoading: boolean;
  currentDeviceGroupError: string | null;

  // Country Sites
  countrySites: CountrySite[];
  countrySitesLoading: boolean;
  countrySitesError: string | null;

  // Actions
  loadDeviceGroups: () => Promise<void>;
  loadDeviceGroup: (id: number) => Promise<void>;
  createDeviceGroup: (data: DeviceGroupCreateRequest) => Promise<void>;
  updateDeviceGroup: (id: number, data: DeviceGroupUpdateRequest) => Promise<void>;
  deleteDeviceGroup: (id: number) => Promise<void>;
  generateQRCode: (id: number) => Promise<{ success: boolean; qr_data: string }>;
  loadCountrySites: () => Promise<void>;
  clearErrors: () => void;
}

export const useDeviceGroupsStore = create<DeviceGroupsState>((set, get) => ({
  // Initial state
  deviceGroups: [],
  deviceGroupsLoading: false,
  deviceGroupsError: null,
  currentDeviceGroup: null,
  currentDeviceGroupLoading: false,
  currentDeviceGroupError: null,
  countrySites: [],
  countrySitesLoading: false,
  countrySitesError: null,

  // Load device groups
  loadDeviceGroups: async () => {
    try {
      set({ deviceGroupsLoading: true, deviceGroupsError: null });
      const response = await deviceGroupService.getDeviceGroups();
      set({ deviceGroups: response.data || [], deviceGroupsLoading: false });
    } catch (error) {
      set({
        deviceGroupsError: error instanceof Error ? error.message : 'Failed to load device groups',
        deviceGroupsLoading: false
      });
    }
  },

  // Load single device group
  loadDeviceGroup: async (id: number) => {
    try {
      set({ currentDeviceGroupLoading: true, currentDeviceGroupError: null });
      const deviceGroup = await deviceGroupService.getDeviceGroup(id);
      set({ currentDeviceGroup: deviceGroup, currentDeviceGroupLoading: false });
    } catch (error) {
      set({
        currentDeviceGroupError: error instanceof Error ? error.message : 'Failed to load device group',
        currentDeviceGroupLoading: false
      });
    }
  },

  // Create device group
  createDeviceGroup: async (data: DeviceGroupCreateRequest) => {
    try {
      await deviceGroupService.createDeviceGroup(data);
      toast.success('Device group created successfully');
      // Reload device groups
      await get().loadDeviceGroups();
    } catch (error) {
      toast.error('Failed to create device group');
      throw error;
    }
  },

  // Update device group
  updateDeviceGroup: async (id: number, data: DeviceGroupUpdateRequest) => {
    try {
      await deviceGroupService.updateDeviceGroup(id, data);
      toast.success('Device group updated successfully');
      // Reload device groups and current device group
      await Promise.all([
        get().loadDeviceGroups(),
        get().loadDeviceGroup(id)
      ]);
    } catch (error) {
      toast.error('Failed to update device group');
      throw error;
    }
  },

  // Delete device group
  deleteDeviceGroup: async (id: number) => {
    try {
      await deviceGroupService.deleteDeviceGroup(id);
      toast.success('Device group deleted successfully');
      // Reload device groups
      await get().loadDeviceGroups();
    } catch (error) {
      toast.error('Failed to delete device group');
      throw error;
    }
  },

  // Generate QR code
  generateQRCode: async (id: number) => {
    try {
      const result = await deviceGroupService.generateQRCode(id);
      return result;
    } catch (error) {
      toast.error('Failed to generate QR code');
      throw error;
    }
  },

  // Load country sites
  loadCountrySites: async () => {
    try {
      set({ countrySitesLoading: true, countrySitesError: null });
      const response = await countrySitesService.getAll();
      set({ countrySites: response.data || [], countrySitesLoading: false });
    } catch (error) {
      set({
        countrySitesError: error instanceof Error ? error.message : 'Failed to load country sites',
        countrySitesLoading: false
      });
    }
  },

  // Clear errors
  clearErrors: () => {
    set({ countrySitesError: null });
  },
})); 