import { apiClient } from './api-client';

export interface DeviceGroup {
    id: number;
    device_group: string;
    country_site_id: number;
    country_site: string;
    device_type: string;
    status: string;
    websocket_url: string;
    api_key: string;
    queue_name: string;
    battery_low_threshold: number;
    error_count_threshold: number;
    offline_threshold_minutes: number;
    signal_low_threshold: number;
    low_balance_threshold: string;
    enable_battery_alarms: boolean;
    enable_error_alarms: boolean;
    enable_offline_alarms: boolean;
    enable_signal_alarms: boolean;
    enable_sim_balance_alarms: boolean;
    auto_disable_sim_on_alarm: boolean;
    sim1_daily_sms_limit: number;
    sim1_monthly_sms_limit: number;
    sim2_daily_sms_limit: number;
    sim2_monthly_sms_limit: number;
    enable_sms_limits: boolean;
    sms_limit_reset_hour: number;
    sim1_guard_interval: number;
    sim2_guard_interval: number;
    created_at: string;
    updated_at: string;
}

export interface DeviceGroupCreateRequest {
    device_group: string;
    country_site_id: number;
    country_site: string;
    device_type?: string;
    status?: string;
    websocket_url?: string;
    queue_name?: string;
    battery_low_threshold?: number;
    error_count_threshold?: number;
    offline_threshold_minutes?: number;
    signal_low_threshold?: number;
    low_balance_threshold?: string;
    enable_battery_alarms?: boolean;
    enable_error_alarms?: boolean;
    enable_offline_alarms?: boolean;
    enable_signal_alarms?: boolean;
    enable_sim_balance_alarms?: boolean;
    auto_disable_sim_on_alarm?: boolean;
    sim1_daily_sms_limit?: number;
    sim1_monthly_sms_limit?: number;
    sim2_daily_sms_limit?: number;
    sim2_monthly_sms_limit?: number;
    enable_sms_limits?: boolean;
    sms_limit_reset_hour?: number;
    sim1_guard_interval?: number;
    sim2_guard_interval?: number;
}

export interface DeviceGroupUpdateRequest {
    device_group?: string;
    country_site_id?: number;
    country_site?: string;
    device_type?: string;
    status?: string;
    websocket_url?: string;
    api_key?: string;
    queue_name?: string;
    battery_low_threshold?: number;
    error_count_threshold?: number;
    offline_threshold_minutes?: number;
    signal_low_threshold?: number;
    low_balance_threshold?: string;
    enable_battery_alarms?: boolean;
    enable_error_alarms?: boolean;
    enable_offline_alarms?: boolean;
    enable_signal_alarms?: boolean;
    enable_sim_balance_alarms?: boolean;
    auto_disable_sim_on_alarm?: boolean;
    sim1_daily_sms_limit?: number;
    sim1_monthly_sms_limit?: number;
    sim2_daily_sms_limit?: number;
    sim2_monthly_sms_limit?: number;
    enable_sms_limits?: boolean;
    sms_limit_reset_hour?: number;
    sim1_guard_interval?: number;
    sim2_guard_interval?: number;
}

export interface DeviceGroupFilters {
    search?: string;
    country_site_id?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface DeviceGroupResponse {
    data: DeviceGroup[];
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

class DeviceGroupService {
    async getDeviceGroups(filters: DeviceGroupFilters = {}): Promise<DeviceGroupResponse> {
        return apiClient.get<DeviceGroupResponse>('/device-groups', filters);
    }

    async getDeviceGroup(id: number): Promise<DeviceGroup> {
        const response = await apiClient.get<{ data: DeviceGroup }>(`/device-groups/${id}`);
        return response.data;
    }

    async createDeviceGroup(data: DeviceGroupCreateRequest): Promise<DeviceGroup> {
        const response = await apiClient.post<{ data: DeviceGroup }>('/device-groups', data);
        return response.data;
    }

    async updateDeviceGroup(id: number, data: DeviceGroupUpdateRequest): Promise<DeviceGroup> {
        const response = await apiClient.put<{ data: DeviceGroup }>(`/device-groups/${id}`, data);
        return response.data;
    }

    async deleteDeviceGroup(id: number): Promise<void> {
        return apiClient.delete<void>(`/device-groups/${id}`);
    }

    async generateQRCode(id: number): Promise<{ success: boolean; qr_data: string }> {
        return apiClient.get<{ success: boolean; qr_data: string }>(`/device-groups/${id}/qr-code`);
    }
}

export const deviceGroupService = new DeviceGroupService(); 