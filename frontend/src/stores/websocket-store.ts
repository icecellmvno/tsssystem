import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useNotificationStore } from './notification-store';
import { useAuthStore } from './auth-store';
import { isTokenExpired } from '@/utils/jwt';
import { toast } from 'sonner';
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

// Additional interfaces from websocketService
export interface DeviceUpdate {
  id: number;
  device_id: string;
  name: string;
  is_online: boolean;
  battery_level?: number;
  battery_status?: string;
  latitude?: number;
  longitude?: number;
  last_seen_at: string;
  status?: string;
}

export interface DeviceAlert {
  device_id: string;
  device_name: string;
  alert_type: 'android_alert' | 'usb_modem_alert' | 'connection_lost' | 'battery_low';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface SmppUserStatusUpdate {
  system_id: string;
  session_id: string;
  remote_addr: string;
  bind_type: string;
  is_online: boolean;
  timestamp: string;
}

interface WebSocketActions {
  // Connection management
  connect: (apiKey: string, isHandicapDevice?: boolean) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Message handling
  send: (message: Partial<WebSocketMessage>) => void;
  onMessage: (type: string, handler: (data: any) => void) => void;
  offMessage: (type: string, handler: (data: any) => void) => void;
  onConnectionChange: (handler: (connected: boolean) => void) => void;
  offConnectionChange: (handler: (connected: boolean) => void) => void;
  ping: () => void;
  
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
  
  // SMPP users management
  updateSmppUser: (systemId: string, data: Partial<SmppUserStatusUpdate>) => void;
  getSmppUser: (systemId: string) => SmppUserStatusUpdate | undefined;
  getAllSmppUsers: () => SmppUserStatusUpdate[];
  
  // Message handling
  handleMessage: (message: WebSocketMessage) => void;
  
  // Device commands
  SendSms: (deviceId: string, data: any) => Promise<void>;
  SendUssd: (deviceId: string, data: any) => Promise<void>;
  FindDevice: (deviceId: string, data: any) => Promise<void>;
  StartAlarm: (deviceId: string, data: any) => Promise<void>;
  StopAlarm: (deviceId: string) => Promise<void>;
}

type WebSocketStore = WebSocketState & WebSocketActions;

export const useWebSocketStore = create<WebSocketStore>()(
  subscribeWithSelector((set, get) => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 5000;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    // Message handlers from websocketService
    const messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
    const connectionHandlers: ((connected: boolean) => void)[] = [];

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

    // Setup page visibility reconnection (from websocketService)
    const setupPageVisibilityReconnection = () => {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && ws?.readyState === WebSocket.CLOSED) {
          const { token } = useAuthStore.getState();
          if (token) {
            get().connect(token);
          }
        }
      });
    };

    // Initialize page visibility handler
    setupPageVisibilityReconnection();

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
      console.log('WebSocket: Device status received:', data);
      // Handle device status updates
    };

    const handleDeviceOnline = (data: any) => {
      console.log('WebSocket: Device online received:', data);
      
      // Update device status to online
      get().updateDevice(data.device_id, {
        status: 'online',
        last_heartbeat: Date.now(),
      });
    };

    const handleDeviceOffline = (data: any) => {
      console.log('WebSocket: Device offline received:', data);
      
      // Update device status to offline
      get().updateDevice(data.device_id, {
        status: 'offline',
        last_heartbeat: Date.now(),
      });
    };

    const handleAlarm = (data: AlarmData) => {
      console.log('WebSocket: Alarm received:', data);
      
             // Add to alarm logs
       get().addAlarmLog({
         id: Date.now(),
         alarm_type: data.alarm_type,
         message: data.message,
         severity: data.severity,
         device_group: data.device_group,
         country_site: data.sitename,
         created_at: new Date().toISOString(),
       });

      // Show toast notification (from websocketService)
      const severityConfig: Record<string, { icon: string; duration: number }> = {
        warning: { icon: '⚠️', duration: 6000 },
        error: { icon: '🚨', duration: 8000 },
        critical: { icon: '🚨', duration: 0 } // Critical alarms don't auto-dismiss
      };

      const config = severityConfig[data.severity] || severityConfig.warning;
      
      toast(`Alarm: ${data.alarm_type.replace('_', ' ').toUpperCase()}`, {
        description: data.message,
        duration: config.duration,
        icon: config.icon,
        action: {
          label: 'View Alarms',
          onClick: () => {
            window.location.href = '/alarm-logs';
          }
        }
      });
    };

    const handleAlarmResolved = (data: AlarmData) => {
      console.log('WebSocket: Alarm resolved received:', data);
      
      // Update alarm log
      get().updateAlarmLog(Date.now(), {
        resolved: true,
        resolved_at: new Date().toISOString(),
      });

      // Show toast notification
      toast('✅ Alarm Resolved', {
        description: `${data.alarm_type}: ${data.message}`,
        duration: 4000,
      });
    };

    const handleSmsLog = (data: SmsLogData) => {
      console.log('WebSocket: SMS log received:', data);
      
             // Add to SMS logs
       get().addSmsLog({
         id: Date.now(),
         sim_slot: data.sim_slot,
         phone_number: data.phone_number,
         message: data.message,
         status: data.status,
         device_group: data.device_group,
         country_site: data.sitename,
         created_at: new Date().toISOString(),
       });
    };

    const handleSmsMessage = (data: SmsMessageData) => {
      console.log('WebSocket: SMS message received:', data);
      
             // Add to SMS logs
       get().addSmsLog({
         id: Date.now(),
         sim_slot: data.sim_slot,
         phone_number: data.phone_number,
         message: data.message,
         direction: data.direction,
         device_group: data.device_group,
         country_site: data.sitename,
         created_at: new Date(data.timestamp).toISOString(),
       });
    };

    const handleUssdResponse = (data: UssdResponseData) => {
      console.log('WebSocket: USSD response received:', data);
      
             // Add to USSD logs
       get().addSmsLog({
         id: Date.now(),
         session_id: data.session_id,
         message_id: data.message_id,
         response: data.cleaned_response,
         status: data.status,
         is_menu: data.is_menu,
         auto_cancel: data.auto_cancel,
         created_at: new Date(data.timestamp).toISOString(),
       });
    };

    const handleUssdResponseFailed = (data: UssdResponseFailedData) => {
      console.log('WebSocket: USSD response failed received:', data);
      
      // Add to USSD logs
      get().addSmsLog({
        id: Date.now(),
        session_id: data.session_id,
        message_id: data.message_id,
        ussd_code: data.ussd_code,
        failure_code: data.failure_code,
        error_message: data.error_message,
        status: data.status,
        created_at: new Date().toISOString(),
      });
    };

    const handleMmsReceived = (data: MmsReceivedData) => {
      console.log('WebSocket: MMS received:', data);
      
             // Add to MMS logs
       get().addSmsLog({
         id: Date.now(),
         sender: data.sender,
         subject: data.subject,
         parts_count: data.parts_count,
         sim_slot: data.sim_slot,
         device_group: data.device_group,
         country_site: data.sitename,
         created_at: new Date(data.timestamp).toISOString(),
       });
    };

    const handleRcsReceived = (data: RcsReceivedData) => {
      console.log('WebSocket: RCS received:', data);
      
             // Add to RCS logs
       get().addSmsLog({
         id: Date.now(),
         sender: data.sender,
         message: data.message,
         message_type: data.message_type,
         sim_slot: data.sim_slot,
         device_group: data.device_group,
         country_site: data.sitename,
         created_at: new Date(data.timestamp).toISOString(),
       });
    };

    const handleUssdCode = (data: UssdCodeData) => {
      console.log('WebSocket: USSD code received:', data);
      
             // Add to USSD logs
       get().addSmsLog({
         id: Date.now(),
         sender: data.sender,
         ussd_code: data.ussd_code,
         sim_slot: data.sim_slot,
         device_group: data.device_group,
         country_site: data.sitename,
         created_at: new Date(data.timestamp).toISOString(),
       });
    };

    const handleFindDeviceSuccess = (data: FindDeviceSuccessData) => {
      console.log('WebSocket: Find device success:', data);
      
      toast('🔍 Device Found', {
        description: data.message,
        duration: 4000,
      });
    };

    const handleFindDeviceFailed = (data: FindDeviceFailedData) => {
      console.log('WebSocket: Find device failed:', data);
      
      toast('❌ Device Not Found', {
        description: data.error,
        duration: 4000,
      });
    };

    const handleAlarmStarted = (data: AlarmStartedData) => {
      console.log('WebSocket: Alarm started:', data);
      
      toast('🚨 Alarm Started', {
        description: `${data.alarm_type}: ${data.message}`,
        duration: 8000,
        action: {
          label: 'View Alarms',
          onClick: () => {
            window.location.href = '/alarm-logs';
          }
        }
      });
    };

    const handleAlarmFailed = (data: AlarmFailedData) => {
      console.log('WebSocket: Alarm failed:', data);
      
      toast('❌ Alarm Failed', {
        description: data.error,
        duration: 4000,
      });
    };

    const handleAlarmStopped = (data: AlarmStoppedData) => {
      console.log('WebSocket: Alarm stopped:', data);
      
      toast('✅ Alarm Stopped', {
        description: 'Alarm has been stopped',
        duration: 4000,
      });
    };

    const handleAlarmStopFailed = (data: AlarmStopFailedData) => {
      console.log('WebSocket: Alarm stop failed:', data);
      
      toast('❌ Alarm Stop Failed', {
        description: data.error,
        duration: 4000,
      });
    };

    const handleUssdCancelled = (data: UssdCancelledData) => {
      console.log('WebSocket: USSD cancelled:', data);
      
      toast('❌ USSD Cancelled', {
        description: data.reason,
        duration: 4000,
      });
    };

    // Handle SMPP User Status Update (from websocketService)
    const handleSmppUserStatusUpdate = (data: SmppUserStatusUpdate) => {
      console.log('SMPP User Status Update:', data);
      
      // Update SMPP user in store
      set(state => {
        const newSmppUsers = new Map(state.smppUsers);
        newSmppUsers.set(data.system_id, data);
        return { smppUsers: newSmppUsers };
      });
      
      // Show notification for status change
      const statusText = data.is_online ? 'connected' : 'disconnected';
      const icon = data.is_online ? '🟢' : '🔴';
      
      toast(`${icon} SMPP User ${statusText}`, {
        description: `${data.system_id} (${data.bind_type}) - ${data.remote_addr}`,
        duration: 4000,
        action: {
          label: 'View Users',
          onClick: () => {
            window.location.href = '/smpp-users';
          }
        }
      });

      // Dispatch custom event for components to listen to
      const event = new CustomEvent('smpp-user-status-update', {
        detail: data
      });
      window.dispatchEvent(event);
    };

    // Handle Device Alert (from websocketService)
    const handleDeviceAlert = (alert: DeviceAlert) => {
      console.log('Device alert received:', alert);
      
      // Show notification based on alert type
      const alertConfig = {
        info: { icon: 'ℹ️', duration: 4000 },
        warning: { icon: '⚠️', duration: 6000 },
        error: { icon: '🚨', duration: 8000 }
      };

      const config = alertConfig[alert.severity];
      
      toast(alert.message, {
        description: `${alert.device_name} (${alert.device_id})`,
        duration: config.duration,
        icon: config.icon,
        action: {
          label: 'View Device',
          onClick: () => {
            // Navigate to device details
            window.location.href = `/devices/${alert.device_id}`;
          }
        }
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
      smppUsers: new Map(),

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
            
            // Notify connection change handlers
            connectionHandlers.forEach(handler => handler(true));
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
            
            // Notify connection change handlers
            connectionHandlers.forEach(handler => handler(false));
            
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
        
        // Notify connection change handlers
        connectionHandlers.forEach(handler => handler(false));
      },

      reconnect: async () => {
        get().disconnect();
        const { token } = useAuthStore.getState();
        if (token) {
          await get().connect(token);
        }
      },

      // Message handling (from websocketService)
      send: (message: Partial<WebSocketMessage>) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        } else {
          console.warn('WebSocket is not connected');
        }
      },

      onMessage: (type: string, handler: (data: any) => void) => {
        if (!messageHandlers.has(type)) {
          messageHandlers.set(type, []);
        }
        messageHandlers.get(type)!.push(handler);
      },

      offMessage: (type: string, handler: (data: any) => void) => {
        const handlers = messageHandlers.get(type);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      },

      onConnectionChange: (handler: (connected: boolean) => void) => {
        connectionHandlers.push(handler);
      },

      offConnectionChange: (handler: (connected: boolean) => void) => {
        const index = connectionHandlers.indexOf(handler);
        if (index > -1) {
          connectionHandlers.splice(index, 1);
        }
      },

      ping: () => {
        get().send({ type: 'ping', data: 'ping' });
      },

      // Device management
      updateDevice: (deviceId: string, data: Partial<Device>) => {
        set((state) => {
          const devices = new Map(state.devices);
          const existingDevice = devices.get(deviceId);
          
          if (existingDevice) {
            // Update existing device
            const updatedDevice = { ...existingDevice, ...data };
            devices.set(deviceId, updatedDevice);
            console.log(`WebSocket: Device updated: ${deviceId} (${updatedDevice.name})`);
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
        return Array.from(get().devices.values()).filter(device => device.device_group === deviceGroup);
      },

      getDevicesBySitename: (sitename: string) => {
        return Array.from(get().devices.values()).filter(device => device.sitename === sitename);
      },

      // Alarm logs management
      addAlarmLog: (alarmLog: any) => {
        set((state) => ({
          alarmLogs: [...state.alarmLogs, alarmLog]
        }));
      },

      updateAlarmLog: (alarmLogId: number, data: Partial<any>) => {
        set((state) => ({
          alarmLogs: state.alarmLogs.map(log => 
            log.id === alarmLogId ? { ...log, ...data } : log
          )
        }));
      },

      removeAlarmLog: (alarmLogId: number) => {
        set((state) => ({
          alarmLogs: state.alarmLogs.filter(log => log.id !== alarmLogId)
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
          smsLogs: state.smsLogs.map(log => 
            log.id === smsLogId ? { ...log, ...data } : log
          )
        }));
      },

      removeSmsLog: (smsLogId: number) => {
        set((state) => ({
          smsLogs: state.smsLogs.filter(log => log.id !== smsLogId)
        }));
      },

      getAllSmsLogs: () => {
        return get().smsLogs;
      },

      // SMPP users management
      updateSmppUser: (systemId: string, data: Partial<SmppUserStatusUpdate>) => {
        set(state => {
          const newSmppUsers = new Map(state.smppUsers);
          const existingUser = newSmppUsers.get(systemId);
          newSmppUsers.set(systemId, { ...existingUser, ...data });
          return { smppUsers: newSmppUsers };
        });
      },
      getSmppUser: (systemId: string) => {
        return get().smppUsers.get(systemId);
      },
      getAllSmppUsers: () => {
        return Array.from(get().smppUsers.values());
      },

      // Device commands
      SendSms: async (deviceId: string, data: any) => {
        get().send({
          type: 'send_sms',
          data: {
            device_id: deviceId,
            ...data
          }
        });
      },

      SendUssd: async (deviceId: string, data: any) => {
        get().send({
          type: 'send_ussd',
          data: {
            device_id: deviceId,
            ...data
          }
        });
      },

      FindDevice: async (deviceId: string, data: any) => {
        get().send({
          type: 'find_device',
          data: {
            device_id: deviceId,
            ...data
          }
        });
      },

      StartAlarm: async (deviceId: string, data: any) => {
        get().send({
          type: 'alarm_start',
          data: {
            device_id: deviceId,
            ...data
          }
        });
      },

      StopAlarm: async (deviceId: string) => {
        get().send({
          type: 'alarm_stop',
          data: {
            device_id: deviceId
          }
        });
      },

      // Message handling
      handleMessage: (message: WebSocketMessage) => {
        const { type, data } = message;
        
        console.log('WebSocket message received:', { type, data });

        // Call registered message handlers first
        const handlers = messageHandlers.get(type);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }

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
          case 'device_online':
            handleDeviceOnline(data);
            break;
          case 'device_offline':
            handleDeviceOffline(data);
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
          case 'device_alert':
            handleDeviceAlert(data as DeviceAlert);
            break;
          case 'smpp_user_status_update':
            handleSmppUserStatusUpdate(data as SmppUserStatusUpdate);
            break;
          default:
            console.log('Unhandled message type:', type);
        }
      },
    };
  })
); 