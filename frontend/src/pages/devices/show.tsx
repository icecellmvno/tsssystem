import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle, Edit, Trash2, Copy, MessageSquare, Phone, Search, Bell, Power, Smartphone, Wrench, MapPin, RefreshCw, Battery, Signal, Wifi, Clock, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/contexts/websocket-context';

import { SmsForm } from '@/components/device-commands/sms-form';
import { UssdForm } from '@/components/device-commands/ussd-form';
import { AlarmForm } from '@/components/device-commands/alarm-form';
import { DataTable } from '@/components/ui/data-table';
import { alarmLogsColumns } from '@/components/devices/alarm-logs-table-columns';
import { alarmLogsService, type AlarmLog } from '@/services/alarm-logs';
import { ColumnDef } from '@tanstack/react-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


interface Device {
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
}

interface Props {
  device?: Device;
  simInfo?: any;
}

// Utility functions for alarm logs
const getAlarmIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'battery_low':
      return <Battery className="h-4 w-4 text-red-600" />;
    case 'signal_low':
      return <Signal className="h-4 w-4 text-red-600" />;
    case 'sim_card_change':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'sim_card_change_resolved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'device_offline':
      return <Wifi className="h-4 w-4 text-red-600" />;
    case 'error_count':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
};

const getAlarmTypeDisplay = (type: string) => {
  switch (type.toLowerCase()) {
    case 'battery_low':
      return 'Battery Low';
    case 'signal_low':
      return 'Signal Low';
    case 'sim_card_change':
      return 'SIM Card Change';
    case 'sim_card_change_resolved':
      return 'SIM Card Change Resolved';
    case 'device_offline':
      return 'Device Offline';
    case 'error_count':
      return 'Error Count';
    default:
      return type;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-300';
    case 'warning':
      return 'bg-yellow-50 text-yellow-700 border-yellow-300';
    case 'info':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-300';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-red-50 text-red-700 border-red-300';
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-300';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-300';
  }
};

// Custom columns for device alarm logs (without device info and actions)
const deviceAlarmLogsColumns: ColumnDef<AlarmLog>[] = [
  {
    accessorKey: 'alarm_type',
    header: 'Alarm Type',
    cell: ({ row }) => {
      const type = row.getValue('alarm_type') as string;
      
      return (
        <div className="flex items-center gap-2">
          {getAlarmIcon(type)}
          <span className="text-sm font-medium">
            {getAlarmTypeDisplay(type)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => {
      const message = row.getValue('message') as string;
      return (
        <div className="max-w-[300px] truncate text-sm" title={message}>
          {message}
        </div>
      );
    },
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    cell: ({ row }) => {
      const severity = row.getValue('severity') as string;
      
      return (
        <Badge variant="outline" className={`text-xs ${getSeverityColor(severity)}`}>
          {severity.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      
      return (
        <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'battery_level',
    header: 'Battery',
    cell: ({ row }) => {
      const batteryLevel = row.getValue('battery_level') as number;
      return (
        <div className="text-sm">
          {batteryLevel > 0 ? `${batteryLevel}%` : 'Unknown'}
        </div>
      );
    },
  },
  {
    accessorKey: 'signal_strength',
    header: 'Signal',
    cell: ({ row }) => {
      const signalStrength = row.getValue('signal_strength') as number;
      const signalDBM = row.getValue('signal_dbm') as number;
      return (
        <div className="text-sm">
          {signalStrength > 0 ? `${signalStrength}/5 (${signalDBM} dBm)` : 'Unknown'}
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => {
      const createdAt = row.getValue('created_at') as string;
      if (!createdAt) return <span className="text-muted-foreground">-</span>;
      
      const date = new Date(createdAt);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      let timeAgo = '';
      if (diffInMinutes < 1) timeAgo = 'Just now';
      else if (diffInMinutes < 60) timeAgo = `${diffInMinutes}m ago`;
      else if (diffInMinutes < 1440) timeAgo = `${Math.floor(diffInMinutes / 60)}h ago`;
      else timeAgo = `${Math.floor(diffInMinutes / 1440)}d ago`;
      
      return (
        <div className="text-sm">
          <div>{timeAgo}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        </div>
      );
    },
  },
];

// Breadcrumbs will be created dynamically based on device data

export default function DeviceShow() {
  const { imei } = useParams<{ imei: string }>();
  const { token, isAuthenticated } = useAuthStore();
  const ws = useWebSocket();
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [smsDialog, setSmsDialog] = useState(false);
  const [ussdDialog, setUssdDialog] = useState(false);
  const [alarmDialog, setAlarmDialog] = useState(false);
  const [simInfo, setSimInfo] = useState<any>(null);
  const [alarmLogs, setAlarmLogs] = useState<AlarmLog[]>([]);
  const [alarmLogsLoading, setAlarmLogsLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    
    if (!isAuthenticated || !token) {
      window.location.href = '/login';
      return;
    }
  }, [isAuthenticated, token]);

  // Fetch device data function
  const fetchDevice = async () => {
    if (!imei || !isAuthenticated || !token) {
      return;
    }
    
    try {
      
      const response = await fetch(`/api/devices/${imei}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      
      if (response.ok) {
        const deviceData = await response.json();
        setDevice(deviceData);
        
        // Set initial SIM info from backend data if available
        if (deviceData.sim_cards && deviceData.sim_cards.length > 0) {
          const simInfoData = {
            sims: deviceData.sim_cards.map((sim: any) => ({
              slot: sim.slot_index,
              is_active: sim.is_active,
              operator: sim.carrier_name || 'Unknown',
              carrier_name: sim.carrier_name || 'Unknown',
              phone_number: sim.phone_number || 'Unknown',
              network_type: sim.network_type || 'Unknown',
              signal_level: sim.signal_strength || 0,
              signal_dbm: sim.signal_dbm || 0,
              imsi: sim.imsi || 'Unknown',
              iccid: sim.iccid || 'Unknown',
              imei: sim.imei || 'Unknown',
              sim_card_status: sim.sim_card_status || 'Unknown',
              status_badge_variant: sim.status_badge_variant || 'secondary',
              signal_strength_badge_variant: sim.signal_strength_badge_variant || 'secondary',
              network_type_badge_variant: sim.network_type_badge_variant || 'secondary',
              signal_strength_text: sim.signal_strength_text || 'Unknown',
              main_balance: sim.main_balance || 0,
              sms_balance: sim.sms_balance || 0,
              sms_limit: sim.sms_limit || 0,
              total_sent: sim.total_sent || 0,
              total_delivered: sim.total_delivered || 0,
              has_sim: true
            }))
          };
          setSimInfo(simInfoData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        console.error('Full error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Check if there are any devices in the database
        try {
          const devicesResponse = await fetch('/api/devices', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (devicesResponse.ok) {
            const devicesData = await devicesResponse.json();
            if (devicesData.devices && devicesData.devices.length === 0) {
              toast.error('No devices found in the database. Please add some devices first.');
            } else {
              toast.error(errorData.message || `Device with IMEI "${imei}" not found`);
            }
          } else {
            toast.error(errorData.message || `Failed to load device (Status: ${response.status})`);
          }
        } catch (checkError) {
          console.error('Error checking devices:', checkError);
          toast.error(errorData.message || `Failed to load device (Status: ${response.status})`);
        }
        
        window.location.href = '/devices';
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      toast.error('Failed to load device - Network error');
      window.location.href = '/devices';
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch device data
  useEffect(() => {
    fetchDevice();
  }, [imei, token, isAuthenticated]);

  // Fetch alarm logs for this device
  const fetchAlarmLogs = async () => {
    if (!imei || !isAuthenticated || !token) {
      return;
    }
    
    setAlarmLogsLoading(true);
    try {
      const response = await fetch(`/api/alarm-logs?device_id=${imei}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlarmLogs(data.data || []);
      } else {
        console.error('Failed to fetch alarm logs');
        setAlarmLogs([]);
      }
    } catch (error) {
      console.error('Error fetching alarm logs:', error);
      setAlarmLogs([]);
    } finally {
      setAlarmLogsLoading(false);
    }
  };

  // Fetch alarm logs when device is loaded
  useEffect(() => {
    if (device) {
      fetchAlarmLogs();
    }
  }, [device]);

  // Update device with WebSocket real-time data
  useEffect(() => {
    if (!device || !imei) return;

    const wsDevices = ws.devices;
    // Try to find device by IMEI first, then by name
    let wsDevice = wsDevices.find(d => d.id === imei);
    if (!wsDevice) {
      wsDevice = wsDevices.find(d => d.name === device.name);
    }
    // Also check for device_offline messages
    if (!wsDevice) {
      wsDevice = wsDevices.find(d => d.device_id === imei);
    }

    if (wsDevice) {
      // Only update if there is a real change
      const isOnline = wsDevice.status === 'online';
      const shouldUpdate =
        device.is_online !== isOnline ||
        device.battery_level !== wsDevice.battery_level ||
        device.battery_status !== wsDevice.battery_status ||
        device.signal_strength !== wsDevice.signal_strength ||
        device.signal_dbm !== wsDevice.signal_dbm ||
        device.network_type !== wsDevice.network_type ||
        device.manufacturer !== wsDevice.manufacturer ||
        device.model !== wsDevice.model ||
        device.android_version !== wsDevice.android_version ||
        device.latitude !== wsDevice.latitude ||
        device.longitude !== wsDevice.longitude;

      if (shouldUpdate) {
        setDevice(prevDevice => {
          if (!prevDevice) return prevDevice;
          return {
            ...prevDevice,
            is_online: isOnline,
            battery_level: wsDevice.battery_level !== undefined ? wsDevice.battery_level : prevDevice.battery_level,
            battery_status: wsDevice.battery_status || prevDevice.battery_status,
            signal_strength: wsDevice.signal_strength !== undefined ? wsDevice.signal_strength : prevDevice.signal_strength,
            signal_dbm: wsDevice.signal_dbm !== undefined ? wsDevice.signal_dbm : prevDevice.signal_dbm,
            network_type: wsDevice.network_type || prevDevice.network_type,
            manufacturer: wsDevice.manufacturer || prevDevice.manufacturer,
            model: wsDevice.model || prevDevice.model,
            android_version: wsDevice.android_version || prevDevice.android_version,
            latitude: wsDevice.latitude !== undefined ? wsDevice.latitude : prevDevice.latitude,
            longitude: wsDevice.longitude !== undefined ? wsDevice.longitude : prevDevice.longitude,
            last_seen: new Date().toISOString(),
          };
        });
      }

      // Update SIM info only if it actually changes
      if (wsDevice.sim_cards) {
        // Create a map of existing SIM cards by slot
        const simCardsMap = new Map();
        wsDevice.sim_cards.forEach((sim: any, index: number) => {
          simCardsMap.set(index + 1, {
            slot: index + 1,
            is_active: sim.is_active,
            operator: sim.carrier_name || 'Unknown',
            carrier_name: sim.carrier_name || 'Unknown',
            phone_number: sim.phone_number || 'Unknown',
            network_type: sim.network_type || 'Unknown',
            signal_level: sim.signal_strength || 0,
            signal_dbm: sim.signal_dbm || 0,
            imsi: sim.imsi || 'Unknown',
            iccid: sim.iccid || 'Unknown',
            imei: sim.imei || 'Unknown',
            sim_card_status: sim.sim_card_status || 'Unknown',
            status_badge_variant: sim.status_badge_variant || 'secondary',
            signal_strength_badge_variant: sim.signal_strength_badge_variant || 'secondary',
            network_type_badge_variant: sim.network_type_badge_variant || 'secondary',
            signal_strength_text: sim.signal_strength_text || 'Unknown',
            main_balance: sim.main_balance || 0,
            sms_balance: sim.sms_balance || 0,
            sms_limit: sim.sms_limit || 0,
            total_sent: sim.total_sent || 0,
            total_delivered: sim.total_delivered || 0,
            has_sim: true
          });
        });

        // Create SIM info with all slots (including empty ones)
        // Use the maximum of WebSocket data length, current simInfo length, or minimum 2 slots
        const currentSimCount = simInfo ? simInfo.sims.length : 0;
        const wsSimCount = wsDevice.sim_cards.length;
        const maxSlots = Math.max(wsSimCount, currentSimCount, 2);
        
        const simInfoData = {
          sims: Array.from({ length: maxSlots }, (_, index) => {
            const slot = index + 1;
            const existingSim = simCardsMap.get(slot);
            
            if (existingSim) {
              return existingSim;
            } else {
              // Empty slot
              return {
                slot,
                is_active: false,
                operator: 'No SIM',
                carrier_name: 'No SIM',
                phone_number: 'No SIM',
                network_type: 'No SIM',
                signal_level: 0,
                signal_dbm: 0,
                imsi: 'No SIM',
                iccid: 'No SIM',
                imei: 'No SIM',
                main_balance: 0,
                sms_balance: 0,
                sms_limit: 0,
                total_sent: 0,
                total_delivered: 0,
                has_sim: false
              };
            }
          })
        };
        
        // Only update if simInfo is different
        if (JSON.stringify(simInfo) !== JSON.stringify(simInfoData)) {
          setSimInfo(simInfoData);
        }
      }
    }
  }, [ws.devices, imei]);

  const handleDelete = async () => {
    if (!device) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Device deleted successfully.');
        // Redirect to devices list
        window.location.href = '/devices';
      } else {
        toast.error('Failed to delete device.');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device.');
    } finally {
      setIsDeleting(false);
    }
  };



  const handleSendSms = async (data: { to: string; message: string; sim_slot: number }) => {
    if (!device) return;
    
    setIsCommandLoading(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sim_slot: data.sim_slot,
          phone_number: data.to,
          message: data.message,
          priority: 'normal'
        })
      });

      if (response.ok) {
        toast.success('SMS sent successfully');
        setSmsDialog(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleExecuteUssd = async (data: { ussd_code: string; sim_slot: number }) => {
    if (!device) return;
    
    setIsCommandLoading(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}/ussd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success('USSD command executed successfully');
        setUssdDialog(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to execute USSD');
      }
    } catch (error) {
      console.error('Error executing USSD:', error);
      toast.error('Failed to execute USSD');
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleFindDevice = async () => {
    if (!device) return;
    
    setIsCommandLoading(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'Find my device' })
      });

      if (response.ok) {
        toast.success('Find device command sent');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to send find device command');
      }
    } catch (error) {
      console.error('Error finding device:', error);
      toast.error('Failed to send find device command');
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleStartAlarm = async () => {
    if (!device) return;
    
    setIsCommandLoading(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}/alarm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          alarm_type: 'sim_blocked',
          message: 'SIM card is blocked - Device needs attention'
        })
      });

      if (response.ok) {
        toast.success('Alarm started successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to start alarm');
      }
    } catch (error) {
      console.error('Error starting alarm:', error);
      toast.error('Failed to start alarm');
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleStopAlarm = async () => {
    if (!device) return;
    
    setIsCommandLoading(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}/alarm/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Alarm stopped successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to stop alarm');
      }
    } catch (error) {
      console.error('Error stopping alarm:', error);
      toast.error('Failed to stop alarm');
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleSendAlarm = async (data: { message: string }) => {
    if (!device) return;
    setIsCommandLoading(true);
    try {
      const alarmData = {
        alarm_type: 'custom_alarm',
        message: data.message || 'Custom alarm triggered - Device needs attention'
      };
      
      const response = await fetch(`/api/devices/${device.imei}/alarm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(alarmData)
      });

      if (response.ok) {
        toast.success('Alarm started successfully');
        setAlarmDialog(false);
        // Refresh alarm logs after sending alarm
        fetchAlarmLogs();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to start alarm');
      }
    } catch (error) {
      console.error('Error sending alarm:', error);
      toast.error('Failed to start alarm');
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleToggleDevice = async (action: 'ENABLE' | 'DISABLE') => {
    if (!device) return;
    setIsCommandLoading(true);
    try {
      const response = await fetch(`/api/devices/${device.imei}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast.success(`Device ${action.toLowerCase()}d successfully`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${action.toLowerCase()} device`);
      }
    } catch (error) {
      console.error('Error toggling device:', error);
      toast.error(`Failed to ${action.toLowerCase()} device`);
    } finally {
      setIsCommandLoading(false);
    }
  };

  const handleExitMaintenanceMode = async (imeis: string[]) => {
    if (!isAuthenticated || !token) return;
    setIsCommandLoading(true);
    try {
      for (const imei of imeis) {
        const response = await fetch(`/api/devices/${imei}/maintenance/exit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to exit maintenance mode');
        }
      }

      toast.success('Maintenance mode exited successfully');
      // Refresh device data
      fetchDevice();
    } catch (error) {
      console.error('Error exiting maintenance mode:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to exit maintenance mode');
    } finally {
      setIsCommandLoading(false);
    }
  };


  const getStatusBadge = (isOnline: boolean, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return isOnline ? <Badge variant="default">Online</Badge> : <Badge variant="outline">Offline</Badge>;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Create dynamic breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Devices',
      href: '/devices',
    },
    {
      title: device ? device.name || device.imei : 'Loading...',
      href: device ? `/devices/${device.imei}` : '#',
    },
  ];

  if (!isAuthenticated || !token) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Authentication required...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading device...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!device) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Device not found</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={ws.isConnected ? "default" : "secondary"}>
                {ws.isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
              </Badge>
              {ws.isConnecting && (
                <Badge variant="outline">Connecting...</Badge>
              )}
              <Badge variant={device.is_online ? "default" : "secondary"}>
                {device.is_online ? "🟢 Online" : "🔴 Offline"}
              </Badge>
              <Badge variant={device.is_active ? "default" : "secondary"}>
                {device.is_active ? "✅ Active" : "❌ Inactive"}
              </Badge>
              {device.maintenance_mode && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  🔧 Maintenance
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Device</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{device.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="sims">SIM Cards</TabsTrigger>
            <TabsTrigger value="alarms">Alarm Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">IMEI</div>
                    <div className="text-sm font-mono bg-muted p-2 rounded">{device.imei}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Device Name</div>
                    <div className="text-sm">{device.name}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Device Type</div>
                    <div className="text-sm">{device.device_type}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Status</div>
                    <div>{getStatusBadge(device.is_online, device.is_active)}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Sitename</div>
                    <div className="text-sm">{device.country_site || 'Not assigned'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Device Group</div>
                    <div className="text-sm">{device.device_group || 'Not assigned'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Latitude</div>
                    <div className="text-sm">{device.latitude || 'Unknown'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Longitude</div>
                    <div className="text-sm">{device.longitude || 'Unknown'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Last Seen</div>
                    <div className="text-sm">{formatDateTime(device.last_seen)}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Manufacturer</div>
                    <div className="text-sm">{device.manufacturer || 'Unknown'}</div>
                  </div>
                </div>

                {/* Map */}
                {device.latitude && device.longitude && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Device Location</div>
                    <div className="w-full h-64 bg-gray-100 rounded-lg border overflow-hidden">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${device.longitude-0.01},${device.latitude-0.01},${device.longitude+0.01},${device.latitude+0.01}&layer=mapnik&marker=${device.latitude},${device.longitude}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        title="Device Location"
                      />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Click on the map to open in full view
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Timestamps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Created At</div>
                    <div className="text-sm">{formatDateTime(device.created_at)}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Updated At</div>
                    <div className="text-sm">{formatDateTime(device.updated_at)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Mode Information */}
            {device.maintenance_mode && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Wrench className="h-5 w-5" />
                    Maintenance Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-orange-700">Reason</div>
                      <div className="text-sm text-orange-600 bg-orange-100 p-2 rounded">
                        {device.maintenance_reason || 'No reason specified'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-orange-700">Started At</div>
                      <div className="text-sm text-orange-600">
                        {formatDateTime(device.maintenance_started_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExitMaintenanceMode([device.imei])}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Exit Maintenance Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Device Details */}
            <Card>
              <CardHeader>
                <CardTitle>Device Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Model</div>
                    <div className="text-sm">{device.model || 'Unknown'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Android Version</div>
                    <div className="text-sm">{device.android_version || 'Unknown'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Battery Level</div>
                    <div className="text-sm">
                      {device.battery_level !== null && device.battery_level !== undefined && device.battery_level > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                device.battery_level > 50 ? 'bg-green-500' : 
                                device.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${device.battery_level}%` }}
                            ></div>
                          </div>
                          <span>{device.battery_level}%</span>
                        </div>
                      ) : 'Unknown'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Battery Status</div>
                    <div className="text-sm">{device.battery_status || 'Unknown'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Signal Strength</div>
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((bar) => (
                            <div
                              key={bar}
                              className={`w-1 h-4 rounded ${
                                bar <= device.signal_strength ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>{device.signal_strength}/5 ({device.signal_dbm} dBm)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Network Type</div>
                    <div className="text-sm">{device.network_type || 'Unknown'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Location</div>
                    <div className="text-sm">
                      {device.latitude && device.longitude 
                        ? `${device.latitude.toFixed(6)}, ${device.longitude.toFixed(6)}`
                        : 'Unknown'
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Connection Status</div>
                    <div className="text-sm">
                      {device.is_online ? 'Online' : 'Offline'} 
                      {device.is_active ? ' (Active)' : ' (Inactive)'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commands" className="space-y-4">
            {/* Device Commands */}
            <Card>
              <CardHeader>
                <CardTitle>Device Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setSmsDialog(true)}
                    disabled={isLoading || !device.is_online}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">Send SMS</span>
                  </Button>

                  <Button
                    onClick={() => setUssdDialog(true)}
                    disabled={isLoading || !device.is_online}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="text-xs">Execute USSD</span>
                  </Button>

                  <Button
                    onClick={handleFindDevice}
                    disabled={isLoading || !device.is_online}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs">Find Device</span>
                  </Button>

                  <Button
                    onClick={() => setAlarmDialog(true)}
                    disabled={isLoading || !device.is_online}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="text-xs">Start Alarm</span>
                  </Button>

                  <Button
                    onClick={handleStopAlarm}
                    disabled={isLoading || !device.is_online}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20 bg-green-50 border-green-200 hover:bg-green-100"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600">Stop Alarm</span>
                  </Button>

                  <Button
                    onClick={() => handleToggleDevice(device.is_active ? 'DISABLE' : 'ENABLE')}
                    disabled={isLoading}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <Power className="h-5 w-5" />
                    <span className="text-xs">{device.is_active ? 'Disable' : 'Enable'}</span>
                  </Button>

                  <Button
                    onClick={() => handleToggleDevice('ENABLE')}
                    disabled={isLoading || device.is_active}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs">Toggle SIM</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sims" className="space-y-4">
            {/* SIM Cards Information */}
            <Card>
              <CardHeader>
                <CardTitle>SIM Cards</CardTitle>
              </CardHeader>
              <CardContent>
                {simInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simInfo.sims.map((sim: any) => (
                      <Card key={sim.slot} className={!sim.has_sim ? "border-gray-200 bg-gray-50" : ""}>
                        <CardHeader>
                          <CardTitle className={`text-lg ${!sim.has_sim ? "text-gray-500" : ""}`}>
                            SIM {sim.slot}
                            {!sim.has_sim && <span className="text-sm font-normal text-gray-400 ml-2">(Empty)</span>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Status</div>
                            <Badge variant={!sim.has_sim ? "secondary" : sim.is_active ? "default" : "secondary"}>
                              {!sim.has_sim ? "No SIM" : sim.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          {sim.has_sim && (
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">SIM Card Status</div>
                                <div className="relative group">
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    <div className="mb-1 font-semibold">Status Definitions:</div>
                                    <div>• Active: SIM working, on route, processing traffic</div>
                                    <div>• Good: SIM operational, device offline</div>
                                    <div>• No Balance: SMS limit reached</div>
                                    <div>• Blocked: SIM blocked, unable to send/receive</div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                variant={
                                  sim.sim_card_status === 'Active' ? 'default' :
                                  sim.sim_card_status === 'Good' ? 'outline' :
                                  sim.sim_card_status === 'No Balance' ? 'destructive' :
                                  sim.sim_card_status === 'Blocked' ? 'destructive' : 'secondary'
                                }
                              >
                                {sim.sim_card_status || 'Unknown'}
                              </Badge>
                            </div>
                          )}
                          
                          {sim.has_sim ? (
                            <>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Operator</div>
                                <div className="text-sm">{sim.operator}</div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Carrier Name</div>
                                <div className="text-sm">{sim.carrier_name}</div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Phone Number</div>
                                <div className="text-sm">{sim.phone_number}</div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Network Type</div>
                                <div className="text-sm">
                                  <Badge variant={sim.network_type_badge_variant || 'secondary'}>
                                    {sim.network_type}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Signal Strength</div>
                                <div className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={sim.signal_strength_badge_variant || 'secondary'}>
                                      {sim.signal_strength_text || 'Unknown'}
                                    </Badge>
                                    <span>({sim.signal_level}/5)</span>
                                  </div>
                                  {sim.signal_dbm && ` (${sim.signal_dbm} dBm)`}
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Main Balance</div>
                                <div className="text-sm">
                                  <Badge variant={sim.main_balance > 0 ? 'default' : 'secondary'} className="font-mono">
                                    ${sim.main_balance ? sim.main_balance.toFixed(2) : '0.00'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">SMS Balance</div>
                                <div className="text-sm">
                                  <Badge 
                                    variant={
                                      sim.sms_balance > 0 ? 'default' : 
                                      sim.sms_balance === 0 ? 'destructive' : 'secondary'
                                    } 
                                    className="font-mono"
                                  >
                                    {sim.sms_balance || 0} SMS
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">SMS Limit</div>
                                <div className="text-sm">
                                  <Badge variant="outline" className="font-mono">
                                    {sim.sms_limit || 0} SMS
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Total Sent</div>
                                <div className="text-sm">
                                  <Badge variant="secondary" className="font-mono">
                                    {sim.total_sent || 0} SMS
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">Total Delivered</div>
                                <div className="text-sm">
                                  <Badge variant="secondary" className="font-mono">
                                    {sim.total_delivered || 0} SMS
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">IMSI</div>
                                <div className="text-sm font-mono text-xs">{sim.imsi}</div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">ICCID</div>
                                <div className="text-sm font-mono text-xs">{sim.iccid}</div>
                              </div>
                              <div className="space-y-2 mt-4">
                                <div className="text-sm font-medium">IMEI</div>
                                <div className="text-sm font-mono text-xs">{sim.imei}</div>
                              </div>
                            </>
                          ) : (
                            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                              <div className="text-sm text-gray-500 text-center">
                                No SIM card inserted in this slot
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Show at least 2 empty slots if no SIM info available */}
                    {[1, 2].map((slot) => (
                      <Card key={slot} className="border-gray-200 bg-gray-50">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-500">
                            SIM {slot}
                            <span className="text-sm font-normal text-gray-400 ml-2">(Empty)</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Status</div>
                            <Badge variant="secondary">No SIM</Badge>
                          </div>
                          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <div className="text-sm text-gray-500 text-center">
                              No SIM card inserted in this slot
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            {/* Alarm Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alarm Logs
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAlarmLogs}
                    disabled={alarmLogsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${alarmLogsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={alarmLogs}
                  columns={deviceAlarmLogsColumns}
                  loading={alarmLogsLoading}
                  showSearch={true}
                  searchPlaceholder="Search alarm logs..."
                  showRowSelection={false}
                  title={`Device Alarm Logs (${alarmLogs.length} records)`}
                  description={`Showing alarm logs for device: ${device?.name || device?.imei}`}
                  showPagination={true}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SMS Dialog */}
        <Dialog open={smsDialog} onOpenChange={setSmsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>
                Send SMS message from this device.
              </DialogDescription>
            </DialogHeader>
            <SmsForm onSubmit={handleSendSms} onCancel={() => setSmsDialog(false)} isLoading={isLoading} />
          </DialogContent>
        </Dialog>

        {/* USSD Dialog */}
        <Dialog open={ussdDialog} onOpenChange={setUssdDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Execute USSD</DialogTitle>
              <DialogDescription>
                Execute USSD command on this device.
              </DialogDescription>
            </DialogHeader>
            <UssdForm onSubmit={handleExecuteUssd} onCancel={() => setUssdDialog(false)} isLoading={isLoading} />
          </DialogContent>
        </Dialog>

        {/* Alarm Dialog */}
        <Dialog open={alarmDialog} onOpenChange={setAlarmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start Alarm</DialogTitle>
              <DialogDescription>
                Start an alarm on this device with a custom message.
              </DialogDescription>
            </DialogHeader>
            <AlarmForm onSubmit={handleSendAlarm} onCancel={() => setAlarmDialog(false)} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 