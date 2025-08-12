import { apiClient } from './api-client';

export interface Device {
  id: number;
  imei: string;
  name: string;
  device_group_id: number;
  device_group: string;
  country_site_id: number;
  country_site: string;
  device_type: string;
  manufacturer: string;
  model: string;
  android_version: string;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  is_online: boolean;
  maintenance_mode: boolean;
  maintenance_reason: string;
  maintenance_started_at: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  alarms?: any[];
  // SMS Limit tracking fields
  sim1_daily_sms_used?: number;
  sim1_monthly_sms_used?: number;
  sim1_daily_limit_reset_at?: string;
  sim1_monthly_limit_reset_at?: string;
  sim2_daily_sms_used?: number;
  sim2_monthly_sms_used?: number;
  sim2_daily_limit_reset_at?: string;
  sim2_monthly_limit_reset_at?: string;
  
  // SMS Limit fields from Device Group (for display purposes)
  sim1_daily_sms_limit?: number;
  sim1_monthly_sms_limit?: number;
  sim2_daily_sms_limit?: number;
  sim2_monthly_sms_limit?: number;
  enable_sms_limits?: boolean;
}

export interface AlarmLog {
  id: number;
  device_id: string;
  device_name: string;
  device_group: string;
  country_site: string;
  alarm_type: string;
  message: string;
  severity: string;
  status: string;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceStats {
  total: number;
  active: number;
  inactive: number;
  online: number;
  offline: number;
  maintenance: number;
  ready: number;
  alarm: number;
}

export interface DevicesResponse {
  data: Device[];
  total: number;
  page: number;
  limit: number;
}

export interface AlarmLogsResponse {
  data: AlarmLog[];
  total: number;
  page: number;
  limit: number;
}

export const deviceService = {
  // Get all devices with pagination
  getDevices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    country_site?: string;
    device_group?: string;
    status?: string;
    online?: string;
    maintenance?: string;
  }): Promise<DevicesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.country_site) searchParams.append('country_site', params.country_site);
    if (params?.device_group) searchParams.append('device_group', params.device_group);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.online) searchParams.append('online', params.online);
    if (params?.maintenance) searchParams.append('maintenance', params.maintenance);

    return apiClient.get<DevicesResponse>(`/devices?${searchParams.toString()}`);
  },

  // Get device by IMEI
  getDevice: async (imei: string): Promise<Device> => {
    return apiClient.get<Device>(`/devices/${imei}`);
  },

  // Get device statistics
  getDeviceStats: async (): Promise<DeviceStats> => {
    const response = await apiClient.get<{ success: boolean; data: DeviceStats }>('/devices/stats');
    return response.data;
  },

  // Delete devices
  deleteDevices: async (imeis: string[]): Promise<{ success: boolean }> => {
    const searchParams = new URLSearchParams();
    imeis.forEach(imei => searchParams.append('imeis', imei));
    return apiClient.delete<{ success: boolean }>(`/devices?${searchParams.toString()}`);
  },

  // Toggle device active status
  toggleDeviceActive: async (imeis: string[], active: boolean): Promise<{ success: boolean }> => {
    return apiClient.put<{ success: boolean }>('/devices/toggle-active', {
      imeis,
      active
    });
  },

  // Enter maintenance mode
  enterMaintenanceMode: async (imeis: string[], reason: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/devices/maintenance/enter', {
      imeis,
      reason
    });
  },

  // Exit maintenance mode
  exitMaintenanceMode: async (imeis: string[]): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/devices/maintenance/exit', {
      imeis
    });
  },

  // Rename device
  renameDevice: async (imei: string, name: string): Promise<{ success: boolean }> => {
    return apiClient.put<{ success: boolean }>(`/devices/${imei}/rename`, {
      name
    });
  },

  // Get alarm logs
  getAlarmLogs: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    device_id?: string;
    alarm_type?: string;
    severity?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AlarmLogsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    else searchParams.append('limit', '50'); // Default to 50 records
    if (params?.search) searchParams.append('search', params.search);
    if (params?.device_id) searchParams.append('device_id', params.device_id);
    if (params?.alarm_type) searchParams.append('alarm_type', params.alarm_type);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    return apiClient.get<AlarmLogsResponse>(`/alarm-logs?${searchParams.toString()}`);
  },

  // Clear alarm logs
  clearAlarmLogs: async (): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>('/alarm-logs');
  },

  // Get SMS limit status for a device
  getSmsLimitStatus: async (imei: string, simSlot: number): Promise<any> => {
    return apiClient.get(`/devices/${imei}/sms-limits/status?sim_slot=${simSlot}`);
  },

  // Reset SMS limits for a device
  resetSmsLimits: async (imei: string, simSlot: number, resetType: string): Promise<{ success: boolean }> => {
    return apiClient.post(`/devices/${imei}/sms-limits/reset`, {
      sim_slot: simSlot,
      reset_type: resetType
    });
  },

  // Bulk update SMS limit data for all devices
  bulkUpdateSmsLimitData: async (): Promise<{ 
    success: boolean; 
    data?: {
      updated_devices: number;
      total_devices: number;
      device_groups_processed: number;
    };
  }> => {
    return apiClient.post('/devices/bulk-update-sms-limits');
  }
}; 