import { apiClient } from './api-client'

export interface SmsMonitoringConfig {
  monitoring_window: number
  min_sms_for_check: number
  maintenance_threshold: number
  check_interval_minutes: number
}

export interface ConfigResponse {
  success: boolean
  data: SmsMonitoringConfig
  message?: string
}

export const configService = {
  // Get current SMS monitoring configuration
  async getSmsMonitoringConfig(): Promise<SmsMonitoringConfig> {
    const response = await apiClient.get<ConfigResponse>('/api/config/sms-monitoring')
    return response.data
  },

  // Update SMS monitoring configuration
  async updateSmsMonitoringConfig(config: SmsMonitoringConfig): Promise<ConfigResponse> {
    const response = await apiClient.put<ConfigResponse>('/api/config/sms-monitoring', config)
    return response
  },

  // Reload configuration from file
  async reloadConfig(): Promise<ConfigResponse> {
    const response = await apiClient.post<ConfigResponse>('/api/config/reload')
    return response
  }
} 