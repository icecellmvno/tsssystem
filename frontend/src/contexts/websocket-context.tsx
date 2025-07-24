import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useWebSocketStore } from '@/stores/websocket-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';
import { websocketService } from '@/services/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  devices: any[];
  connect: (apiKey: string, isHandicapDevice?: boolean) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  getDevice: (deviceId: string) => any;
  getAllDevices: () => any[];
  getDevicesByGroup: (deviceGroup: string) => any[];
  getDevicesBySitename: (sitename: string) => any[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const {
    isConnected,
    isConnecting,
    error,
    devices,
    connect,
    disconnect,
    reconnect,
    getDevice,
    getAllDevices,
    getDevicesByGroup,
    getDevicesBySitename,
  } = useWebSocketStore();

  const { token, isAuthenticated, user } = useAuthStore();

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && !isConnected && !isConnecting) {
      // Connect both WebSocket service and store
      Promise.all([
        websocketService.connect(token),
        connect(token, false)
      ]).catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
      });
    }
  }, [isAuthenticated, token, isConnected, isConnecting, user?.role]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      websocketService.disconnect();
      disconnect();
    }
  }, [isAuthenticated, isConnected]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (error && isAuthenticated && !isConnecting && token) {
      const timeoutId = setTimeout(() => {
        Promise.all([
          websocketService.connect(token),
          reconnect()
        ]).catch((error) => {
          console.error('Failed to reconnect:', error);
        });
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [error, isAuthenticated, isConnecting, token]);

  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting,
    error,
    devices: Array.from(devices.values()),
    connect,
    disconnect,
    reconnect,
    getDevice,
    getAllDevices,
    getDevicesByGroup,
    getDevicesBySitename,
  };

  // Debug log for devices
  useEffect(() => {
    console.log('WebSocket Context - Devices updated:', Array.from(devices.values()));
    console.log('WebSocket Context - Device count:', devices.size);
    console.log('WebSocket Context - Device statuses:', Array.from(devices.values()).map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      battery_level: d.battery_level,
      battery_status: d.battery_status,
      device_group: d.device_group,
      sitename: d.sitename
    })));
  }, [devices]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 