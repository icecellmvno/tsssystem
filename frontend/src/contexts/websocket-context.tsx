import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useWebSocketStore } from '@/stores/websocket-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired } from '@/utils/jwt';

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  devices: any[];
  alarmLogs: any[];
  smsLogs: any[];
  smppUsers: any[];
  connect: (apiKey: string, isHandicapDevice?: boolean) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  getDevice: (deviceId: string) => any;
  getAllDevices: () => any[];
  getDevicesByGroup: (deviceGroup: string) => any[];
  getDevicesBySitename: (sitename: string) => any[];
  getAllAlarmLogs: () => any[];
  getAllSmsLogs: () => any[];
  getAllSmppUsers: () => any[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const {
    isConnected,
    isConnecting,
    error,
    devices,
    alarmLogs,
    smsLogs,
    smppUsers,
    connect,
    disconnect,
    reconnect,
    getDevice,
    getAllDevices,
    getDevicesByGroup,
    getDevicesBySitename,
    getAllAlarmLogs,
    getAllSmsLogs,
    getAllSmppUsers,
  } = useWebSocketStore();

  const { token, isAuthenticated, user, checkTokenExpiration } = useAuthStore();

  // Periodic token expiration check
  useEffect(() => {
    if (isAuthenticated && token) {
      const interval = setInterval(() => {
        checkTokenExpiration();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token, checkTokenExpiration]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && !isConnected && !isConnecting) {
      // Check if token is expired before connecting
      if (isTokenExpired(token)) {
        console.log('JWT token is expired, logging out user');
        const authStore = useAuthStore.getState();
        authStore.logout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      // Connect using only useWebSocketStore (no more websocketService)
      connect(token, false).catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
      });
    }
  }, [isAuthenticated, token, isConnected, isConnecting, user?.role]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (error && isAuthenticated && !isConnecting && token) {
      const timeoutId = setTimeout(() => {
        reconnect().catch((error) => {
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
    alarmLogs,
    smsLogs,
    smppUsers: Array.from(smppUsers.values()),
    connect,
    disconnect,
    reconnect,
    getDevice,
    getAllDevices,
    getDevicesByGroup,
    getDevicesBySitename,
    getAllAlarmLogs,
    getAllSmsLogs,
    getAllSmppUsers,
  };

  // Debug log for devices
  useEffect(() => {
    if (devices.size > 0) {
      console.log('WebSocket Context - Devices updated:', devices.size, 'devices');
      console.log('WebSocket Context - Device statuses:', Array.from(devices.values()).map(d => ({
        id: d.id,
        name: d.name,
        status: d.status,
        battery_level: d.battery_level,
        signal_strength: d.signal_strength,
        is_online: d.status === 'online'
      })));
    }
  }, [devices]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}; 