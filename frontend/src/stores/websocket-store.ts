import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useNotificationStore } from './notification-store';
import { useAuthStore } from './auth-store';
import { isTokenExpired } from '@/utils/jwt';
import type { 
  WebSocketState, 
  WebSocketMessage, 
  Device, 
  HeartbeatData, 
  DeviceStatusData, 
  AlarmData,
  SmsLogData,
  SmsMessageData,
  UssdResponseData,
  UssdResponseFailedData,
  MmsReceivedData,
  RcsReceivedData,
  UssdCodeData,
  FindDeviceSuccessData,
  FindDeviceFailedData,
  AlarmStartedData,
  AlarmFailedData,
  AlarmStoppedData,
  AlarmStopFailedData,
  UssdCancelledData
} from '@/types/websocket';

interface WebSocketActions {
  // Connection management
  connect: (apiKey: string, isHandicapDevice?: boolean) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Device management
  updateDevice: (deviceId: string, data: Partial<Device>) => void;
  removeDevice: (deviceId: string) => void;
  getDevice: (deviceId: string) => Device | undefined;
  getAllDevices: () => Device[];
  getDevicesByGroup: (deviceGroup: string) => Device[];
  getDevicesBySitename: (sitename: string) => Device[];
  
  // Alarm logs management
  addAlarmLog: (alarmLog: any) => void;
  updateAlarmLog: (alarmLogId: number, data: Partial<any>) => void;
  removeAlarmLog: (alarmLogId: number) => void;
  getAllAlarmLogs: () => any[];
  
  // SMS logs management
  addSmsLog: (smsLog: any) => void;
  updateSmsLog: (smsLogId: number, data: Partial<any>) => void;
  removeSmsLog: (smsLogId: number) => void;
  getAllSmsLogs: () => any[];
  
  // Message handling
  handleMessage: (message: WebSocketMessage) => void;
  
  // Device commands
  SendSms: (deviceId: string, data: any) => Promise<void>;
  SendUssd: (deviceId: string, data: any) => Promise<void>;
  FindDevice: (deviceId: string, data: any) => Promise<void>;
  StartAlarm: (deviceId: string, data: any) => Promise<void>;
  StopAlarm: (deviceId: string) => Promise<void>;
  
  // State setters
  setError: (error: string | null) => void;
  setConnecting: (connecting: boolean) => void;
}

type WebSocketStore = WebSocketState & WebSocketActions;

export const useWebSocketStore = create<WebSocketStore>()(
  subscribeWithSelector((set, get) => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 5000;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const startHeartbeat = () => {
      heartbeatInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    };

    const handleHeartbeat = (data: any) => {
      const deviceId = data.device_info.imei;
      console.log('WebSocket: Heartbeat received for device:', deviceId, 'Battery:', data.battery_level, 'Signal:', data.signal_strength);
      
      get().updateDevice(deviceId, {
        name: data.device_name, // Use device name from database
        device_group: data.device_info.device_group,
        sitename: data.device_info.sitename,
        status: 'online',
        last_heartbeat: Date.now(),
        battery_level: data.battery_level !== undefined && data.battery_level !== null && data.battery_level > 0 ? data.battery_level : undefined,
        battery_status: data.battery_status,
        signal_strength: data.signal_strength !== undefined && data.signal_strength !== null ? data.signal_strength : undefined,
        signal_dbm: data.signal_dbm !== undefined && data.signal_dbm !== null ? data.signal_dbm : undefined,
        network_type: data.network_type,
        manufacturer: data.device_info.manufacturer,
        model: data.device_info.model,
        android_version: data.device_info.android_version,
        sim_cards: data.sim_cards,
        location: data.location,
      });
    };

    const handleDeviceStatus = (data: DeviceStatusData) => {
      const devices = get().getAllDevices();
      devices.forEach(device => {
        if (device.device_group === data.device_group && device.sitename === data.sitename) {
          get().updateDevice(device.id, { status: data.status });
        }
      });

      if (data.status === 'error' || data.status === 'offline') {
        useNotificationStore.getState().addNotification({
          type: 'device_status',
          title: `Device Status: ${data.status.toUpperCase()}`,
          message: `Device group "${data.device_group}" at "${data.sitename}" is ${data.status}`,
          severity: data.status === 'error' ? 'error' : 'warning',
          device_group: data.device_group,
          sitename: data.sitename,
        });
      }
    };

    const handleAlarm = (data: AlarmData) => {
      console.log('WebSocket: Alarm received:', data);
      
      // Update device alarms
      if (data.device_id) {
        get().updateDevice(data.device_id, {
          alarms: [...(get().getDevice(data.device_id)?.alarms || []), data]
        });
          
        // Check for critical scenarios and set maintenance mode
          if (data.alarm_type === 'sim_card_change') {
          const isCriticalScenario = data.message.includes('SIM tray opened') || 
                                   data.message.includes('IMSI changed') ||
                                   data.message.includes('SIM card count changed');
          if (isCriticalScenario) {
            get().updateDevice(data.device_id, {
              maintenance_mode: true,
              maintenance_reason: `SIM card change: ${data.message}`,
              maintenance_started_at: new Date().toISOString(),
              is_active: false
            });
          }
        }
      }

      // Add to real-time alarm logs
      const alarmLog = {
        id: Date.now(), // Temporary ID for real-time logs
        device_id: data.device_id || 'Unknown',
        device_name: data.device_id || 'Unknown',
        device_group: data.device_group,
        country_site: data.sitename,
        alarm_type: data.alarm_type,
        message: data.message,
        severity: data.severity,
        status: 'started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      get().addAlarmLog(alarmLog);
            
      // Create notification
      let notificationTitle = `Alarm: ${data.alarm_type.replace('_', ' ').toUpperCase()}`;
      let notificationMessage = data.message;
            if (data.alarm_type === 'sim_card_change') {
        if (data.message.includes('SIM tray opened')) {
          notificationTitle = '🚨 SIM Tray Opened';
          notificationMessage = `Device ${data.device_id || 'Unknown'} SIM tray has been opened - all SIM cards removed`;
        } else if (data.message.includes('IMSI changed')) {
          notificationTitle = '🔄 SIM Card Changed';
          notificationMessage = `Device ${data.device_id || 'Unknown'} has different IMSI detected`;
        } else if (data.message.includes('SIM card count changed')) {
          notificationTitle = '📊 SIM Card Count Changed';
          notificationMessage = `Device ${data.device_id || 'Unknown'} SIM card count has changed`;
            }
      }

      useNotificationStore.getState().addNotification({
        type: 'alarm',
        title: notificationTitle,
        message: notificationMessage,
        severity: data.severity,
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleAlarmResolved = (data: AlarmData) => {
      console.log('WebSocket: Alarm resolved:', data);
      
      // Update device alarms
      if (data.device_id) {
        const device = get().getDevice(data.device_id);
        if (device) {
          const updatedAlarms = device.alarms.filter(alarm => 
            alarm.alarm_type !== data.alarm_type || alarm.message !== data.message
          );
          get().updateDevice(data.device_id, { alarms: updatedAlarms });
          
          // Remove maintenance mode for specific scenarios
          if (data.alarm_type === 'sim_card_change') {
            const shouldRemoveMaintenance = data.message.includes('SIM tray closed with same IMSIs') || 
                                         data.message.includes('SIM card reinserted') ||
                                         data.message.includes('SIM card configuration resolved');
            if (shouldRemoveMaintenance) {
            get().updateDevice(data.device_id, {
                maintenance_mode: false,
                maintenance_reason: '',
                maintenance_started_at: '',
                is_active: true
              });
            }
          }
        }
      }

      // Add resolved alarm to real-time logs
      const alarmLog = {
        id: Date.now(), // Temporary ID for real-time logs
        device_id: data.device_id || 'Unknown',
        device_name: data.device_id || 'Unknown',
        device_group: data.device_group,
        country_site: data.sitename,
        alarm_type: data.alarm_type,
        message: data.message,
        severity: data.severity,
        status: 'resolved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      get().addAlarmLog(alarmLog);

      // Create notification
      let notificationTitle = `Alarm Resolved: ${data.alarm_type.replace('_', ' ').toUpperCase()}`;
      let notificationMessage = data.message;
      if (data.alarm_type === 'sim_card_change') {
        if (data.message.includes('SIM tray closed with same IMSIs')) {
          notificationTitle = '✅ SIM Tray Closed - Same IMSIs';
          notificationMessage = `Device ${data.device_id || 'Unknown'} SIM tray closed with same IMSIs - normal operation resumed`;
        } else if (data.message.includes('SIM card reinserted')) {
          notificationTitle = '✅ SIM Cards Reinserted';
          notificationMessage = `Device ${data.device_id || 'Unknown'} SIM cards have been reinserted`;
        } else if (data.message.includes('SIM card configuration resolved')) {
          notificationTitle = '✅ SIM Configuration Resolved';
          notificationMessage = `Device ${data.device_id || 'Unknown'} SIM card configuration has been resolved`;
        }
      }

      useNotificationStore.getState().addNotification({
        type: 'info',
        title: notificationTitle,
        message: notificationMessage,
        severity: 'info',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleSmsLog = (data: SmsLogData) => {
      // Add SMS log to store for real-time updates
      const smsLog = {
        id: Date.now(), // Temporary ID for real-time logs
        message_id: `realtime_${Date.now()}`,
        device_id: null,
        device_name: null,
        device_imei: null,
        device_imsi: null,
        simcard_name: null,
        sim_slot: data.sim_slot,
        simcard_number: null,
        simcard_iccid: null,
        source_addr: null,
        source_connector: 'android',
        source_user: 'device',
        destination_addr: data.phone_number,
        message: data.message,
        message_length: data.message.length,
        direction: 'outbound',
        priority: 'normal',
        status: data.status,
        sent_at: new Date().toISOString(),
        delivered_at: data.status === 'delivered' ? new Date().toISOString() : null,
        delivery_report_status: data.status,
        delivery_report_received_at: new Date().toISOString(),
        received_at: null,
        error_message: data.status === 'failed' ? 'SMS sending failed' : null,
        device_group_id: null,
        device_group: data.device_group,
        country_site_id: null,
        country_site: data.sitename,
        campaign_id: null,
        batch_id: null,
        queued_at: null,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      get().addSmsLog(smsLog);

      useNotificationStore.getState().addNotification({
        type: 'sms',
        title: `SMS ${data.status.toUpperCase()}`,
        message: `SMS to ${data.phone_number}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
        severity: data.status === 'failed' ? 'error' : 'info',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleSmsMessage = (data: SmsMessageData) => {
      if (data.direction === 'received') {
        // Add inbound SMS log to store for real-time updates
        const smsLog = {
          id: Date.now(), // Temporary ID for real-time logs
          message_id: `realtime_inbound_${Date.now()}`,
          device_id: null,
          device_name: null,
          device_imei: null,
          device_imsi: null,
          simcard_name: null,
          sim_slot: data.sim_slot,
          simcard_number: null,
          simcard_iccid: null,
          source_addr: data.phone_number,
          source_connector: 'android',
          source_user: 'device',
          destination_addr: 'Device',
          message: data.message,
          message_length: data.message.length,
          direction: 'inbound',
          priority: 'normal',
          status: 'received',
          sent_at: null,
          delivered_at: null,
          delivery_report_status: null,
          delivery_report_received_at: null,
          received_at: new Date().toISOString(),
          error_message: null,
          device_group_id: null,
          device_group: data.device_group,
          country_site_id: null,
          country_site: data.sitename,
          campaign_id: null,
          batch_id: null,
          queued_at: null,
          metadata: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        get().addSmsLog(smsLog);

        useNotificationStore.getState().addNotification({
          type: 'sms',
          title: 'SMS Received',
          message: `From ${data.phone_number}: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
          severity: 'info',
          device_group: data.device_group,
          sitename: data.sitename,
        });
      }
    };

    const handleUssdResponse = (data: UssdResponseData) => {
      useNotificationStore.getState().addNotification({
        type: 'ussd',
        title: 'USSD Response',
        message: `USSD response received: ${data.cleaned_response.substring(0, 50)}${data.cleaned_response.length > 50 ? '...' : ''}`,
        severity: 'info',
      });
    };

    const handleUssdResponseFailed = (data: UssdResponseFailedData) => {
      useNotificationStore.getState().addNotification({
        type: 'ussd',
        title: 'USSD Failed',
        message: `USSD code ${data.ussd_code} failed: ${data.error_message}`,
        severity: 'error',
      });
    };

    const handleMmsReceived = (data: MmsReceivedData) => {
      useNotificationStore.getState().addNotification({
        type: 'sms',
        title: 'MMS Received',
        message: `MMS from ${data.sender}: ${data.subject} (${data.parts_count} parts)`,
        severity: 'info',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleRcsReceived = (data: RcsReceivedData) => {
      useNotificationStore.getState().addNotification({
        type: 'sms',
        title: 'RCS Received',
        message: `RCS ${data.message_type} from ${data.sender}`,
        severity: 'info',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleUssdCode = (data: UssdCodeData) => {
      useNotificationStore.getState().addNotification({
        type: 'ussd',
        title: 'USSD Code Received',
        message: `USSD code ${data.ussd_code} from ${data.sender}`,
        severity: 'info',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleFindDeviceSuccess = (data: FindDeviceSuccessData) => {
      useNotificationStore.getState().addNotification({
        type: 'device_status',
        title: 'Find Device Success',
        message: data.message,
        severity: 'info',
      });
    };

    const handleFindDeviceFailed = (data: FindDeviceFailedData) => {
      useNotificationStore.getState().addNotification({
        type: 'device_status',
        title: 'Find Device Failed',
        message: data.error,
        severity: 'error',
      });
    };

    const handleAlarmStarted = (data: AlarmStartedData) => {
      useNotificationStore.getState().addNotification({
        type: 'alarm',
        title: 'Alarm Started',
        message: data.message,
        severity: 'warning',
      });
    };

    const handleAlarmFailed = (data: AlarmFailedData) => {
      useNotificationStore.getState().addNotification({
        type: 'alarm',
        title: 'Alarm Failed',
        message: data.error,
        severity: 'error',
      });
    };

    const handleAlarmStopped = (_data: AlarmStoppedData) => {
      useNotificationStore.getState().addNotification({
        type: 'alarm',
        title: 'Alarm Stopped',
        message: 'Alarm has been stopped',
        severity: 'info',
      });
    };

    const handleAlarmStopFailed = (data: AlarmStopFailedData) => {
      useNotificationStore.getState().addNotification({
        type: 'alarm',
        title: 'Alarm Stop Failed',
        message: data.error,
        severity: 'error',
      });
    };

    const handleUssdCancelled = (data: UssdCancelledData) => {
      useNotificationStore.getState().addNotification({
        type: 'ussd',
        title: 'USSD Cancelled',
        message: `USSD code ${data.ussd_code} cancelled: ${data.reason}`,
        severity: 'warning',
      });
    };

    const handleDeviceOnline = (data: any) => {
      const deviceId = data.device_id;
      get().updateDevice(deviceId, {
        status: 'online',
        last_heartbeat: Date.now(),
      });

      useNotificationStore.getState().addNotification({
        type: 'device_status',
        title: 'Device Online',
        message: `${data.device_name} (${data.device_id}) is now online`,
        severity: 'info',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleDeviceOffline = (data: any) => {
      const deviceId = data.device_id;
      get().updateDevice(deviceId, {
        status: 'offline',
        last_heartbeat: Date.now(),
        // Ensure we have the device name for display
        name: data.device_name || `Device-${deviceId}`,
        device_group: data.device_group || '',
        sitename: data.sitename || '',
      });

      useNotificationStore.getState().addNotification({
        type: 'device_status',
        title: 'Device Offline',
        message: `${data.device_name} (${data.device_id}) is now offline`,
        severity: 'warning',
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    return {
      // Initial state
      isConnected: false,
      isConnecting: false,
      error: null,
      devices: new Map(),
      alarmLogs: [],
      smsLogs: [],

      // Connection management
      connect: async (apiKey: string, isHandicapDevice = false) => {
        if (ws?.readyState === WebSocket.OPEN) {
          return;
        }

        // Check if token is expired before connecting
        if (isTokenExpired(apiKey)) {
          console.log('JWT token is expired, logging out user');
          const authStore = useAuthStore.getState();
          authStore.logout();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        set({ isConnecting: true, error: null });

        try {
          const wsUrl = `/ws?type=frontend&token=${apiKey}`;

          ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            set({ isConnecting: false, isConnected: true });
            reconnectAttempts = 0;
            console.log('WebSocket connected');
            startHeartbeat();
          };

          ws.onmessage = (event) => {
            console.log('Raw WebSocket message:', event.data);
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              get().handleMessage(message);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
            }
          };

          ws.onclose = (event) => {
            set({ isConnected: false, isConnecting: false });
            stopHeartbeat();
            
            console.log('WebSocket disconnected:', event.code, event.reason);
            
            // Check if the connection was closed due to authentication failure
            if (event.code === 1008 || event.code === 1003 || 
                event.reason?.includes('Invalid token') || 
                event.reason?.includes('JWT') || 
                event.reason?.includes('Token expired')) {
              console.log('WebSocket connection closed due to authentication failure, logging out user');
              const authStore = useAuthStore.getState();
              authStore.logout();
              // Also clear localStorage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // Redirect to login
              window.location.href = '/login';
              return; // Don't attempt to reconnect
            }
            
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
              setTimeout(() => {
                reconnectAttempts++;
                get().connect(apiKey, isHandicapDevice);
              }, reconnectDelay);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            set({ error: 'Connection failed', isConnecting: false });
          };

        } catch (error) {
          set({ error: 'Failed to establish connection', isConnecting: false });
          throw error;
        }
      },

      disconnect: () => {
        if (ws) {
          ws.close(1000, 'Manual disconnect');
          ws = null;
        }
        stopHeartbeat();
        set({ isConnected: false, isConnecting: false });
      },

      reconnect: async () => {
        get().disconnect();
      },

      // Device management
      updateDevice: (deviceId: string, data: Partial<Device>) => {
        set((state) => {
          const devices = new Map(state.devices);
          const existingDevice = devices.get(deviceId);
          
          if (existingDevice) {
            // Update existing device with new data
            const updatedDevice = { 
              ...existingDevice, 
              ...data,
              // Ensure battery_level is only updated if it's a valid value
              battery_level: data.battery_level !== undefined && data.battery_level !== null && data.battery_level > 0 
                ? data.battery_level 
                : existingDevice.battery_level,
              // Ensure signal_strength is only updated if it's a valid value
              signal_strength: data.signal_strength !== undefined && data.signal_strength !== null 
                ? data.signal_strength 
                : existingDevice.signal_strength,
              // Ensure signal_dbm is only updated if it's a valid value
              signal_dbm: data.signal_dbm !== undefined && data.signal_dbm !== null 
                ? data.signal_dbm 
                : existingDevice.signal_dbm,
            };
            devices.set(deviceId, updatedDevice);
            
            // Log device status changes
            if (data.status && data.status !== existingDevice.status) {
              console.log(`WebSocket: Device ${deviceId} status changed from ${existingDevice.status} to ${data.status}`);
            }
          } else {
            // New device: create with provided data
            const newDevice = {
              id: deviceId,
              name: data.name || `Device-${deviceId}`,
              device_group: data.device_group || '',
              sitename: data.sitename || '',
              status: data.status || 'offline',
              last_heartbeat: data.last_heartbeat || Date.now(),
              battery_level: data.battery_level !== undefined && data.battery_level !== null && data.battery_level > 0 ? data.battery_level : 0,
              battery_status: data.battery_status || '',
              signal_strength: data.signal_strength !== undefined && data.signal_strength !== null ? data.signal_strength : 0,
              signal_dbm: data.signal_dbm !== undefined && data.signal_dbm !== null ? data.signal_dbm : 0,
              network_type: data.network_type || '',
              manufacturer: data.manufacturer || '',
              model: data.model || '',
              android_version: data.android_version || '',
              sim_cards: data.sim_cards || [],
              location: data.location || { latitude: 0, longitude: 0 },
              alarms: data.alarms || [],
              maintenance_mode: data.maintenance_mode || false,
              maintenance_reason: data.maintenance_reason || '',
              maintenance_started_at: data.maintenance_started_at || '',
            };
            devices.set(deviceId, newDevice);
            console.log(`WebSocket: New device added: ${deviceId} (${newDevice.name})`);
          }
          
          return { devices };
        });
      },

      removeDevice: (deviceId: string) => {
        set((state) => {
          const devices = new Map(state.devices);
          devices.delete(deviceId);
          return { devices };
        });
      },

      getDevice: (deviceId: string) => {
        return get().devices.get(deviceId);
      },

      getAllDevices: () => {
        return Array.from(get().devices.values());
      },

      getDevicesByGroup: (deviceGroup: string) => {
        return Array.from(get().devices.values()).filter(
          device => device.device_group === deviceGroup
        );
      },

      getDevicesBySitename: (sitename: string) => {
        return Array.from(get().devices.values()).filter(
          device => device.sitename === sitename
        );
      },

      // Alarm logs management
      addAlarmLog: (alarmLog: any) => {
        set((state) => ({
          alarmLogs: [...state.alarmLogs, alarmLog]
        }));
      },
      updateAlarmLog: (alarmLogId: number, data: Partial<any>) => {
        set((state) => ({
          alarmLogs: state.alarmLogs.map((log, index) =>
            index === alarmLogId ? { ...log, ...data } : log
          )
        }));
      },
      removeAlarmLog: (alarmLogId: number) => {
        set((state) => ({
          alarmLogs: state.alarmLogs.filter((_, index) => index !== alarmLogId)
        }));
      },
      getAllAlarmLogs: () => {
        return get().alarmLogs;
      },

      // SMS logs management
      addSmsLog: (smsLog: any) => {
        set((state) => ({
          smsLogs: [...state.smsLogs, smsLog]
        }));
      },
      updateSmsLog: (smsLogId: number, data: Partial<any>) => {
        set((state) => ({
          smsLogs: state.smsLogs.map((log, index) =>
            index === smsLogId ? { ...log, ...data } : log
          )
        }));
      },
      removeSmsLog: (smsLogId: number) => {
        set((state) => ({
          smsLogs: state.smsLogs.filter((_, index) => index !== smsLogId)
        }));
      },
      getAllSmsLogs: () => {
        return get().smsLogs;
      },

      // Message handling
      handleMessage: (message: WebSocketMessage) => {
        const { type, data } = message;
        
        console.log('WebSocket message received:', { type, data });

        switch (type) {
          case 'connection_established':
            // Connection established, settings received
            console.log('Connection established, settings received:', data);
            break;
          case 'pong':
            // Pong response from server
            console.log('Pong received from server');
            break;
          case 'error':
            // Error message from server
            console.error('Error from server:', data);
            
            // Handle authentication errors
            if (data && typeof data === 'object' && 'error' in data && 
                (data.error === 'Invalid token' || data.error === 'Token expired')) {
              console.log('Authentication error received, logging out user');
              const authStore = useAuthStore.getState();
              authStore.logout();
              // Also clear localStorage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // Redirect to login
              window.location.href = '/login';
            }
            break;
          case 'heartbeat':
            handleHeartbeat(data as HeartbeatData);
            break;
          case 'device_status':
            handleDeviceStatus(data as DeviceStatusData);
            break;
          case 'alarm':
            handleAlarm(data as AlarmData);
            break;
          case 'alarm_resolved':
            handleAlarmResolved(data as AlarmData);
            break;
          case 'sim_card_change_alarm_resolved':
            handleAlarmResolved(data as AlarmData);
            break;
          case 'sms_log':
            handleSmsLog(data as SmsLogData);
            break;
          case 'sms_message':
            handleSmsMessage(data as SmsMessageData);
            break;
          case 'sms_delivery_report':
            // Handle SMS delivery report
            console.log('SMS delivery report received:', data);
            break;
          case 'ussd_response':
            handleUssdResponse(data as UssdResponseData);
            break;
          case 'ussd_response_failed':
            handleUssdResponseFailed(data as UssdResponseFailedData);
            break;
          case 'mms_received':
            handleMmsReceived(data as MmsReceivedData);
            break;
          case 'rcs_received':
            handleRcsReceived(data as RcsReceivedData);
            break;
          case 'ussd_code':
            handleUssdCode(data as UssdCodeData);
            break;
          case 'find_device_success':
            handleFindDeviceSuccess(data as FindDeviceSuccessData);
            break;
          case 'find_device_failed':
            handleFindDeviceFailed(data as FindDeviceFailedData);
            break;
          case 'alarm_started':
            handleAlarmStarted(data as AlarmStartedData);
            break;
          case 'alarm_failed':
            handleAlarmFailed(data as AlarmFailedData);
            break;
          case 'alarm_stopped':
            handleAlarmStopped(data as AlarmStoppedData);
            break;
          case 'alarm_stop_failed':
            handleAlarmStopFailed(data as AlarmStopFailedData);
            break;
          case 'ussd_cancelled':
            handleUssdCancelled(data as UssdCancelledData);
            break;
          case 'device_online':
            handleDeviceOnline(data);
            break;
          case 'device_offline':
            handleDeviceOffline(data);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      },

      // Device commands
      SendSms: async (deviceId: string, data: any) => {
        // TODO: Implement API call to backend
        console.log('Sending SMS to device:', deviceId, data);
      },
      SendUssd: async (deviceId: string, data: any) => {
        // TODO: Implement API call to backend
        console.log('Sending USSD to device:', deviceId, data);
      },
      FindDevice: async (deviceId: string, data: any) => {
        // TODO: Implement API call to backend
        console.log('Finding device:', deviceId, data);
      },
      StartAlarm: async (deviceId: string, data: any) => {
        // TODO: Implement API call to backend
        console.log('Starting alarm for device:', deviceId, data);
      },
      StopAlarm: async (deviceId: string) => {
        try {
          const response = await fetch(`/api/devices/${deviceId}/alarm/stop`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log('Stop alarm response:', result);
          return result;
        } catch (error) {
          console.error('Failed to stop alarm:', error);
          throw error;
        }
      },

      // State setters
      setError: (error: string | null) => set({ error }),
      setConnecting: (connecting: boolean) => set({ isConnecting: connecting }),
    };
  })
); 