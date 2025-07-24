import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useNotificationStore } from './notification-store';
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
      get().updateDevice(deviceId, {
        name: data.device_name, // Use device name from database
        device_group: data.device_info.device_group,
        sitename: data.device_info.sitename,
        status: 'online',
        last_heartbeat: Date.now(),
        battery_level: data.battery_level !== undefined && data.battery_level !== null && data.battery_level > 0 ? data.battery_level : undefined,
        battery_status: data.battery_status,
        signal_strength: data.signal_strength,
        signal_dbm: data.signal_dbm,
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
      const devices = get().getAllDevices();
      devices.forEach(device => {
        if (device.device_group === data.device_group && device.sitename === data.sitename) {
          const alarms = [...device.alarms, data];
          get().updateDevice(device.id, { alarms });
          
          // Handle SIM card change alarm - set device to maintenance mode
          if (data.alarm_type === 'sim_card_change') {
            get().updateDevice(device.id, {
              maintenance_mode: true,
              maintenance_reason: 'SIM card change detected',
              maintenance_started_at: new Date().toISOString(),
              is_active: false
            });
          }
        }
      });

      useNotificationStore.getState().addNotification({
        type: 'alarm',
        title: `Alarm: ${data.alarm_type.replace('_', ' ').toUpperCase()}`,
        message: data.message,
        severity: data.severity,
        device_group: data.device_group,
        sitename: data.sitename,
      });
    };

    const handleSmsLog = (data: SmsLogData) => {
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

    const handleAlarmStopped = (data: AlarmStoppedData) => {
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

      // Connection management
      connect: async (apiKey: string, isHandicapDevice = false) => {
        if (ws?.readyState === WebSocket.OPEN) {
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
            // Existing device: don't override name, only update other fields
            const { name, battery_level, ...updateData } = data;
            
            // Only update battery_level if it's a valid value
            const finalBatteryLevel = battery_level !== undefined && battery_level !== null && battery_level > 0 
              ? battery_level 
              : existingDevice.battery_level;
            
            const updatedDevice = { 
              ...existingDevice, 
              ...updateData,
              battery_level: finalBatteryLevel
            };
            devices.set(deviceId, updatedDevice);
            
            // Log device status changes
            if (data.status && data.status !== existingDevice.status) {
              console.log(`Device ${deviceId} status changed from ${existingDevice.status} to ${data.status}`);
            }
          } else {
            // New device: use provided name or default format
            const newDevice = {
              id: deviceId,
              name: data.name || `Device-${deviceId}`,
              device_group: data.device_group || '',
              sitename: data.sitename || '',
              status: data.status || 'offline',
              last_heartbeat: data.last_heartbeat || Date.now(),
              battery_level: data.battery_level !== undefined && data.battery_level !== null && data.battery_level > 0 ? data.battery_level : 0,
              battery_status: data.battery_status || '',
              signal_strength: data.signal_strength || 0,
              signal_dbm: data.signal_dbm || 0,
              network_type: data.network_type || '',
              manufacturer: data.manufacturer || '',
              model: data.model || '',
              android_version: data.android_version || '',
              sim_cards: data.sim_cards || [],
              location: data.location || { latitude: 0, longitude: 0 },
              alarms: data.alarms || [],
            };
            devices.set(deviceId, newDevice);
            console.log(`New device added to WebSocket store: ${deviceId} (${newDevice.name})`);
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