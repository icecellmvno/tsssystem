export interface WebSocketMessage {
  type: string;
  timestamp: number;
  data: any;
}

export interface DeviceInfo {
  manufacturer: string;
  model: string;
  android_version: string;
  device_id: string;
  sitename: string;
  device_group: string;
}

export interface SimCard {
  slot_index: number;
  carrier_name: string;
  phone_number: string;
  network_mcc: string;
  network_mnc: string;
  is_active: boolean;
  imei: string;
  imsi: string;
  iccid: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface HeartbeatData {
  device_info: DeviceInfo;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
  sim_cards: SimCard[];
  location: Location;
}

export interface DeviceStatusData {
  status: 'online' | 'offline' | 'error' | 'maintenance';
  device_group: string;
  sitename: string;
  details: any;
}

export interface AlarmData {
  device_id?: string;
  alarm_type: 'battery_low' | 'signal_low' | 'sim_balance_low' | 'error_count' | 'offline' | 'sim_blocked' | 'sms_blocked' | 'mms_blocked' | 'ussd_blocked' | 'sim_card_change';
  message: string;
  severity: 'warning' | 'error' | 'critical';
  device_group: string;
  sitename: string;
}

export interface SmsLogData {
  sim_slot: number;
  phone_number: string;
  message: string;
  status: 'sent' | 'failed' | 'delivered';
  device_group: string;
  sitename: string;
}

export interface SmsMessageData {
  phone_number: string;
  message: string;
  direction: 'received' | 'sent';
  sim_slot: number;
  timestamp: number;
  formatted_timestamp: string;
  device_group: string;
  sitename: string;
}

export interface SmsDeliveryReportData {
  phone_number: string;
  message_id: string;
  status: 'delivered' | 'failed' | 'pending';
  sim_slot: number;
  timestamp: number;
  device_group: string;
  sitename: string;
}

export interface UssdResponseData {
  session_id: string;
  message_id: string;
  response: string;
  cleaned_response: string;
  status: 'RESPONSE_RECEIVED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  is_menu: boolean;
  auto_cancel: boolean;
  timestamp: number;
}

export interface UssdResponseFailedData {
  session_id: string;
  message_id: string;
  ussd_code: string;
  sim_slot: number;
  failure_code: number;
  error_message: string;
  status: 'FAILED';
}

export interface MmsReceivedData {
  sender: string;
  subject: string;
  parts_count: number;
  sim_slot: number;
  timestamp: number;
  device_group: string;
  sitename: string;
  parts: Array<{
    content_type: string;
    content_id: string;
    file_name: string;
    data_size: number;
  }>;
}

export interface RcsReceivedData {
  sender: string;
  message: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  sim_slot: number;
  timestamp: number;
  device_group: string;
  sitename: string;
}

export interface UssdCodeData {
  sender: string;
  ussd_code: string;
  sim_slot: number;
  timestamp: number;
  device_group: string;
  sitename: string;
}

export interface FindDeviceSuccessData {
  message: string;
  status: 'success';
  timestamp: number;
}

export interface FindDeviceFailedData {
  message: string;
  status: 'failed';
  error: string;
  timestamp: number;
}

export interface AlarmStartedData {
  alarm_type: string;
  message: string;
  status: 'started';
  timestamp: number;
}

export interface AlarmFailedData {
  alarm_type: string;
  message: string;
  status: 'failed';
  error: string;
  timestamp: number;
}

export interface AlarmStoppedData {
  status: 'stopped';
  timestamp: number;
}

export interface AlarmStopFailedData {
  status: 'failed';
  error: string;
  timestamp: number;
}

export interface UssdCancelledData {
  session_id: string;
  message_id: string;
  ussd_code: string;
  sim_slot: number;
  status: 'CANCELLED';
  reason: string;
  timestamp: number;
}

export interface DeviceSettings {
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
}

export interface ConnectionEstablishedData {
  settings: DeviceSettings;
}

export interface Device {
  id: string;
  name?: string;
  device_group: string;
  sitename: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  last_heartbeat: number;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm?: number;
  network_type: string;
  manufacturer?: string;
  model?: string;
  android_version?: string;
  sim_cards: SimCard[];
  location: Location;
  alarms: AlarmData[];
  maintenance_mode?: boolean;
  maintenance_reason?: string;
  maintenance_started_at?: string;
  is_active?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  devices: Map<string, Device>;
  alarmLogs: any[];
  smsLogs: any[];
}

export interface Notification {
  id: string;
  type: 'alarm' | 'alarm_resolved' | 'sms' | 'ussd' | 'device_status';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  device_id?: string;
  device_group?: string;
  sitename?: string;
  timestamp: number;
  read: boolean;
} 