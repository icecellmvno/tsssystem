import { toast } from 'sonner';
import { useWebSocketStore } from '@/stores/websocket-store';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  user_id?: number;
}

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

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  constructor() {
    this.setupReconnection();
  }

  private setupReconnection() {
    // Auto-reconnect on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.ws?.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    });
  }

  public connect(token?: string): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `/ws?type=frontend&token=${token || ''}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('Raw WebSocket message:', event.data);
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
            
            // Also forward to WebSocket store
            const wsStore = useWebSocketStore.getState();
            wsStore.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.notifyConnectionChange(false);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect(token);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
  }

  public send(message: Partial<WebSocketMessage>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public onMessage(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  public offMessage(type: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public onConnectionChange(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler);
  }

  public offConnectionChange(handler: (connected: boolean) => void) {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }

    // Handle specific message types
    switch (message.type) {
      case 'device_update':
        this.handleDeviceUpdate(message.data as DeviceUpdate);
        break;
      case 'device_alert':
        this.handleDeviceAlert(message.data as DeviceAlert);
        break;
      case 'alarm_started':
        this.handleAlarmStarted(message.data);
        break;
      case 'alarm_stopped':
        this.handleAlarmStopped(message.data);
        break;
      case 'alarm':
        this.handleAlarm(message.data);
        break;
      case 'smpp_user_status_update':
        this.handleSmppUserStatusUpdate(message.data as SmppUserStatusUpdate);
        break;
      case 'connected':
        console.log('WebSocket connection confirmed');
        break;
      case 'error':
        console.error('WebSocket error:', message.data);
        break;
    }
  }

  private handleDeviceUpdate(device: DeviceUpdate) {
    // This will be handled by the devices store
    console.log('Device update received:', device);
  }

  private handleDeviceAlert(alert: DeviceAlert) {
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
  }

  private handleAlarmStarted(data: any) {
    console.log('Alarm started:', data);
    
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
  }

  private handleAlarmStopped(data: any) {
    console.log('Alarm stopped:', data);
    
    toast('✅ Alarm Stopped', {
      description: `Alarm has been stopped`,
      duration: 4000,
    });
  }

  private handleAlarm(data: any) {
    console.log('Alarm received:', data);
    
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
  }

  private handleSmppUserStatusUpdate(data: SmppUserStatusUpdate) {
    console.log('SMPP User Status Update:', data);
    
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
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public ping() {
    this.send({ type: 'ping', data: 'ping' });
  }
}

export const websocketService = new WebSocketService(); 