import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useWebSocket } from '@/contexts/websocket-context';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, Eye, Trash2, Check, X, Power, Smartphone, Wifi, Activity, Signal, Edit, RefreshCw, AlertTriangle, Clock, Wrench } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

interface Device {
  id: number;
  imei: string;
  name: string;
  device_group_id: number;
  device_group: string;
  sitename_id: number;
  sitename: string;
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

interface AlarmLog {
  id: number;
  device_id: string;
  device_name: string;
  device_group: string;
  sitename: string;
  alarm_type: string;
  message: string;
  severity: string;
  status: string;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
  created_at: string;
  updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Site Management', href: '#' },
  { title: 'Devices', href: '/devices' },
];

export default function DevicesIndex() {
  const ws = useWebSocket();
  const { token } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [alarmLogs, setAlarmLogs] = useState<AlarmLog[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [alarmLogsLoading, setAlarmLogsLoading] = useState(true);
  
  // Filter states
  const [sitenameFilter, setSitenameFilter] = useState('all');
  const [deviceGroupFilter, setDeviceGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [maintenanceFilter, setMaintenanceFilter] = useState('all');
  
  // Alarm log filter states
  const [alarmDeviceFilter, setAlarmDeviceFilter] = useState('all');
  const [alarmTypeFilter, setAlarmTypeFilter] = useState('all');
  const [alarmSeverityFilter, setAlarmSeverityFilter] = useState('all');
  const [alarmStatusFilter, setAlarmStatusFilter] = useState('all');
  const [alarmSitenameFilter, setAlarmSitenameFilter] = useState('all');
  const [alarmDeviceGroupFilter, setAlarmDeviceGroupFilter] = useState('all');

  // Rename dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Maintenance dialog states
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [maintenanceImeis, setMaintenanceImeis] = useState<string[]>([]);

  // Fetch devices from API
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      } else {
        toast.error('Failed to fetch devices');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  // Fetch alarm logs from API
  const fetchAlarmLogs = async () => {
    try {
      setAlarmLogsLoading(true);
      const response = await fetch('/api/alarm-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlarmLogs(data.alarm_logs || []);
      } else {
        toast.error('Failed to fetch alarm logs');
      }
    } catch (error) {
      console.error('Error fetching alarm logs:', error);
      toast.error('Failed to fetch alarm logs');
    } finally {
      setAlarmLogsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDevices();
    fetchAlarmLogs();
  }, []);

  // Update devices with WebSocket real-time data
  useEffect(() => {
    const wsDevices = ws.devices;
    if (wsDevices.length > 0) {
      console.log('WebSocket devices received:', wsDevices);
      console.log('WebSocket devices structure:', wsDevices.map(d => ({
        id: d.id,
        name: d.name,
        status: d.status,
        device_group: d.device_group,
        sitename: d.sitename,
        hasId: !!d.id,
        hasName: !!d.name
      })));
      
      // Merge WebSocket data with API data
      setDevices(prevDevices => {
        const updatedDevices = [...prevDevices];
        
        wsDevices.forEach(wsDevice => {
          // Skip devices with undefined ID
          if (!wsDevice.id) {
            console.log('Skipping device with undefined ID:', wsDevice.name);
            // Try to extract IMEI from sim_cards if available
            if (wsDevice.sim_cards && wsDevice.sim_cards.length > 0) {
              const firstSim = wsDevice.sim_cards[0];
              if (firstSim.imei) {
                wsDevice.id = firstSim.imei;
                console.log('Extracted IMEI from sim_cards:', firstSim.imei);
              }
            }
            // If still no ID, skip this device
            if (!wsDevice.id) {
              return;
            }
          }
          
          // For device_offline messages, the device_id might be in a different field
          if (wsDevice.status === 'offline' && !wsDevice.id && wsDevice.device_id) {
            wsDevice.id = wsDevice.device_id;
            console.log('Using device_id as ID for offline device:', wsDevice.device_id);
          }
          
          // Try to match by IMEI first (WebSocket device ID is IMEI)
          let existingIndex = updatedDevices.findIndex(d => d.imei === wsDevice.id);
          
          // If not found by IMEI, try by device name or other identifiers
          if (existingIndex === -1) {
            existingIndex = updatedDevices.findIndex(d => 
              d.name === wsDevice.name || 
              d.imei === wsDevice.device_id ||
              d.id.toString() === wsDevice.id ||
              // Try matching by model and manufacturer as fallback
              (d.model === wsDevice.model && d.manufacturer === wsDevice.manufacturer)
            );
          }
          
          // Also check if this is a device_offline message
          if (existingIndex === -1 && wsDevice.status === 'offline') {
            // For offline messages, try to find by device_id from the offline message
            existingIndex = updatedDevices.findIndex(d => d.imei === wsDevice.device_id);
            
            // If still not found, try to find by device name and group
            if (existingIndex === -1 && wsDevice.name && wsDevice.device_group) {
              existingIndex = updatedDevices.findIndex(d => 
                d.name === wsDevice.name && 
                d.device_group === wsDevice.device_group
              );
            }
            
            // If still not found, try to find by device name only
            if (existingIndex === -1 && wsDevice.name) {
              existingIndex = updatedDevices.findIndex(d => d.name === wsDevice.name);
            }
            
            // Log if device is still not found
            if (existingIndex === -1) {
              console.log('Could not find device for offline update:', {
                wsDeviceId: wsDevice.id,
                wsDeviceName: wsDevice.name,
                wsDeviceGroup: wsDevice.device_group,
                wsDeviceIdField: wsDevice.device_id,
                availableDevices: updatedDevices.map(d => ({ name: d.name, imei: d.imei, group: d.device_group }))
              });
            } else {
              console.log('Found device for offline update at index:', existingIndex, 'Device:', updatedDevices[existingIndex].name);
            }
          }
          
          if (existingIndex >= 0) {
            console.log('Updating device:', wsDevice.id, 'with data:', wsDevice);
            console.log('Matched existing device at index:', existingIndex, 'Device name:', updatedDevices[existingIndex].name);
            // Update existing device with real-time data
            updatedDevices[existingIndex] = {
              ...updatedDevices[existingIndex],
              is_online: wsDevice.status === 'online',
              manufacturer: wsDevice.manufacturer || updatedDevices[existingIndex].manufacturer,
              model: wsDevice.model || updatedDevices[existingIndex].model,
              android_version: wsDevice.android_version || updatedDevices[existingIndex].android_version,
              battery_level: wsDevice.battery_level || updatedDevices[existingIndex].battery_level,
              battery_status: wsDevice.battery_status || updatedDevices[existingIndex].battery_status,
              signal_strength: wsDevice.signal_strength || updatedDevices[existingIndex].signal_strength,
              signal_dbm: wsDevice.signal_dbm || updatedDevices[existingIndex].signal_dbm,
              network_type: wsDevice.network_type || updatedDevices[existingIndex].network_type,
              last_seen: new Date().toISOString(),
              // Update maintenance mode fields from WebSocket if available
              maintenance_mode: wsDevice.maintenance_mode !== undefined ? wsDevice.maintenance_mode : updatedDevices[existingIndex].maintenance_mode,
              maintenance_reason: wsDevice.maintenance_reason || updatedDevices[existingIndex].maintenance_reason,
              maintenance_started_at: wsDevice.maintenance_started_at || updatedDevices[existingIndex].maintenance_started_at,
            };
            
            // Log when device goes offline
            if (wsDevice.status === 'offline') {
              console.log('Device went offline:', wsDevice.id, 'Device name:', updatedDevices[existingIndex].name);
              console.log('Updated device data:', updatedDevices[existingIndex]);
            }
          } else {
            console.log('Device not found in API data:', wsDevice.id, 'Adding as new device');
            console.log('Available devices for matching:', updatedDevices.map(d => ({ name: d.name, imei: d.imei, model: d.model, manufacturer: d.manufacturer })));
            // Add new device from WebSocket if not in API data
            const newDevice: Device = {
              id: Date.now(), // Use timestamp as ID for new devices
              imei: wsDevice.id || `unknown-${Date.now()}`, // WebSocket device ID is IMEI, fallback if undefined
              name: wsDevice.name || `Device-${wsDevice.id || 'unknown'}`,
              device_group_id: 0,
              device_group: wsDevice.device_group || 'Unknown',
              sitename_id: 0,
              sitename: wsDevice.sitename || 'Unknown',
              device_type: 'unknown',
              manufacturer: wsDevice.manufacturer || '',
              model: wsDevice.model || '',
              android_version: wsDevice.android_version || '',
              battery_level: wsDevice.battery_level || 0,
              battery_status: wsDevice.battery_status || '',
              signal_strength: wsDevice.signal_strength || 0,
              signal_dbm: wsDevice.signal_dbm || 0,
              network_type: wsDevice.network_type || '',
              latitude: wsDevice.location?.latitude || 0,
              longitude: wsDevice.location?.longitude || 0,
              is_active: true,
              is_online: wsDevice.status === 'online',
              maintenance_mode: false,
              maintenance_reason: '',
              maintenance_started_at: '',
              last_seen: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            updatedDevices.push(newDevice);
          }
        });
        
        return updatedDevices;
      });
    }
  }, [ws.devices]);

  // Real-time WebSocket connection status
  useEffect(() => {
    if (ws.isConnected) {
      console.log('WebSocket connected, devices will update in real-time');
    }
  }, [ws.isConnected]);

  // Debug: Log device updates with battery status
  useEffect(() => {
    console.log('Devices updated:', devices.length, 'devices');
    devices.forEach(device => {
      console.log(`Device ${device.name} (${device.imei}): battery_level=${device.battery_level}, battery_status="${device.battery_status}"`);
      if (device.maintenance_mode) {
        console.log(`Device ${device.name} (${device.imei}) is in maintenance mode:`, device.maintenance_reason);
      }
    });
  }, [devices]);

  // Device statistics - update in real-time
  const deviceStats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(d => d.is_online).length;
    const active = devices.filter(d => d.is_active).length;
    const inactive = devices.filter(d => !d.is_active).length;
    const offline = devices.filter(d => !d.is_online).length;
    const maintenance = devices.filter(d => d.maintenance_mode).length;
    
    return {
      total,
      online,
      offline,
      active,
      inactive,
      maintenance,
      onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [devices]);

  // Get unique sitenames and device groups for filters
  const uniqueSitenames = useMemo(() => {
    const sitenames = devices.map(d => d.sitename).filter(Boolean);
    return [...new Set(sitenames)];
  }, [devices]);

  const uniqueDeviceGroups = useMemo(() => {
    const groups = devices.map(d => d.device_group).filter(Boolean);
    return [...new Set(groups)];
  }, [devices]);

  // Get unique alarm log filters
  const uniqueAlarmDevices = useMemo(() => {
    const deviceNames = alarmLogs.map(a => a.device_name).filter(Boolean);
    return [...new Set(deviceNames)];
  }, [alarmLogs]);

  const uniqueAlarmTypes = useMemo(() => {
    const types = alarmLogs.map(a => a.alarm_type).filter(Boolean);
    return [...new Set(types)];
  }, [alarmLogs]);

  const uniqueAlarmSeverities = useMemo(() => {
    const severities = alarmLogs.map(a => a.severity).filter(Boolean);
    return [...new Set(severities)];
  }, [alarmLogs]);

  const uniqueAlarmStatuses = useMemo(() => {
    const statuses = alarmLogs.map(a => a.status).filter(Boolean);
    return [...new Set(statuses)];
  }, [alarmLogs]);

  // Add new filter arrays
  const uniqueAlarmSitenames = useMemo(() => {
    const sitenames = alarmLogs.map(a => a.sitename).filter(Boolean);
    return [...new Set(sitenames)];
  }, [alarmLogs]);

  const uniqueAlarmDeviceGroups = useMemo(() => {
    const groups = alarmLogs.map(a => a.device_group).filter(Boolean);
    return [...new Set(groups)];
  }, [alarmLogs]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = globalFilter === '' || 
        device.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        device.imei.toLowerCase().includes(globalFilter.toLowerCase());
      
      const matchesSitename = sitenameFilter === 'all' || device.sitename === sitenameFilter;
      const matchesGroup = deviceGroupFilter === 'all' || device.device_group === deviceGroupFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && device.is_active) ||
        (statusFilter === 'inactive' && !device.is_active);
      const matchesOnline = onlineFilter === 'all' ||
        (onlineFilter === 'online' && device.is_online) ||
        (onlineFilter === 'offline' && !device.is_online);
      const matchesMaintenance = maintenanceFilter === 'all' ||
        (maintenanceFilter === 'active' && device.maintenance_mode) ||
        (maintenanceFilter === 'inactive' && !device.maintenance_mode);
      
      return matchesSearch && matchesSitename && matchesGroup && matchesStatus && matchesOnline && matchesMaintenance;
    });
  }, [devices, globalFilter, sitenameFilter, deviceGroupFilter, statusFilter, onlineFilter, maintenanceFilter]);

  // Filtered alarm logs
  const filteredAlarmLogs = useMemo(() => {
    return alarmLogs.filter(alarm => {
      const matchesDevice = alarmDeviceFilter === 'all' || alarm.device_name === alarmDeviceFilter;
      const matchesType = alarmTypeFilter === 'all' || alarm.alarm_type === alarmTypeFilter;
      const matchesSeverity = alarmSeverityFilter === 'all' || alarm.severity === alarmSeverityFilter;
      const matchesStatus = alarmStatusFilter === 'all' || alarm.status === alarmStatusFilter;
      const matchesSitename = alarmSitenameFilter === 'all' || alarm.sitename === alarmSitenameFilter;
      const matchesDeviceGroup = alarmDeviceGroupFilter === 'all' || alarm.device_group === alarmDeviceGroupFilter;
      
      return matchesDevice && matchesType && matchesSeverity && matchesStatus && matchesSitename && matchesDeviceGroup;
    });
  }, [alarmLogs, alarmDeviceFilter, alarmTypeFilter, alarmSeverityFilter, alarmStatusFilter, alarmSitenameFilter, alarmDeviceGroupFilter]);

  // TanStack Table columns for devices
  const deviceColumns = useMemo<ColumnDef<Device, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 32,
    },
    {
      accessorKey: 'imei',
      header: 'IMEI',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'device_group',
      header: 'Device Group',
      cell: (info) => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'model',
      header: 'Model',
      cell: (info) => {
        const model = info.getValue() as string;
        const manufacturer = info.row.original.manufacturer as string;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{model || 'N/A'}</span>
            {manufacturer && (
              <span className="text-xs text-muted-foreground">{manufacturer}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'android_version',
      header: 'Android',
      cell: (info) => {
        const version = info.getValue() as string;
        return version ? (
          <Badge variant="outline" className="text-xs">
            {version}
          </Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: 'signal_strength',
      header: 'Signal',
      cell: (info) => {
        const signalStrength = info.getValue() as number;
        const signalDbm = info.row.original.signal_dbm as number;
        const networkType = info.row.original.network_type as string;
        
        if (signalStrength === null || signalStrength === undefined) {
          return <span className="text-muted-foreground">N/A</span>;
        }
        
        const getSignalColor = (strength: number) => {
          if (strength >= 4) return 'text-green-500';
          if (strength >= 2) return 'text-yellow-500';
          return 'text-red-500';
        };
        
        const getSignalIcon = (strength: number) => {
          if (strength >= 4) return '📶';
          if (strength >= 2) return '📶';
          return '📶';
        };
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{getSignalIcon(signalStrength)}</span>
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${getSignalColor(signalStrength)}`}>
                {signalStrength}/5
              </span>
              {signalDbm && (
                <span className="text-xs text-muted-foreground">
                  {signalDbm} dBm
                </span>
              )}
              {networkType && (
                <span className="text-xs text-muted-foreground">
                  {networkType}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'battery_level',
      header: 'Battery',
      cell: (info) => {
        const batteryLevel = info.getValue() as number;
        const batteryStatus = info.row.original.battery_status as string;
        
        if (batteryLevel === null || batteryLevel === undefined || batteryLevel === 0) {
          return <span className="text-muted-foreground">N/A</span>;
        }
        
        const getBatteryColor = (level: number) => {
          if (level <= 20) return 'text-red-500';
          if (level <= 50) return 'text-yellow-500';
          return 'text-green-500';
        };
        
        const getBatteryIcon = (status: string) => {
          if (status?.includes('charging')) return '🔌';
          if (status?.includes('discharging')) return '🔋';
          if (status?.includes('full')) return '🔋';
          if (status?.includes('not_charging')) return '🔌'; // Add this line
          return '🔋';
        };

        const getBatteryStatusText = (status: string) => {
          if (status?.includes('charging')) return 'Charging';
          if (status?.includes('discharging')) return 'Discharging';
          if (status?.includes('full')) return 'Full';
          if (status?.includes('not_charging')) return 'Not Charging';
          return 'Unknown';
        };
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{getBatteryIcon(batteryStatus)}</span>
            <div className="flex-1 min-w-[60px]">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getBatteryColor(batteryLevel)}`}
                  style={{ width: `${batteryLevel}%` }}
                ></div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs font-medium ${getBatteryColor(batteryLevel)}`}>
                {batteryLevel}%
              </span>
              <span className="text-xs text-muted-foreground">
                {getBatteryStatusText(batteryStatus)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: (info) => info.getValue() ? (
        <Badge variant="default">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
    },
    {
      accessorKey: 'is_online',
      header: 'Status',
      cell: (info) => {
        const isOnline = info.getValue() as boolean;
        const isActive = info.row.original.is_active as boolean;
        const maintenanceMode = info.row.original.maintenance_mode as boolean;
        const maintenanceReason = info.row.original.maintenance_reason as string;
        
        if (maintenanceMode) {
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="destructive" className="text-xs">
                🔧 MAINTENANCE
              </Badge>
              {maintenanceReason && (
                <div className="text-xs text-muted-foreground max-w-[150px] truncate" title={maintenanceReason}>
                  {maintenanceReason}
                </div>
              )}
            </div>
          );
        }
        
        if (!isActive) {
          return (
            <Badge variant="destructive" className="text-xs">
              INACTIVE
            </Badge>
          );
        }
        
        return (
          <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'sitename',
      header: 'Sitename',
      cell: (info) => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'last_seen',
      header: 'Last Seen',
      cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : 'Never',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const device = row.original as Device;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openRenameDialog(device)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {device.is_online && (
              <Link to={`/devices/${device.imei}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {device.maintenance_mode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleExitMaintenanceMode([device.imei])}
                title="Exit Maintenance Mode"
              >
                <Wrench className="h-4 w-4 text-orange-500" />
              </Button>
            )}
            {!device.maintenance_mode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMaintenanceImeis([device.imei]);
                  setMaintenanceDialogOpen(true);
                }}
                title="Enter Maintenance Mode"
              >
                <Wrench className="h-4 w-4 text-blue-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete([device.imei])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleActive([device.imei], !device.is_active)}
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  // TanStack Table columns for alarm logs
  const alarmLogColumns = useMemo<ColumnDef<AlarmLog, any>[]>(() => [
    {
      accessorKey: 'device_name',
      header: 'Device',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'device_group',
      header: 'Device Group',
      cell: (info) => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'sitename',
      header: 'Sitename',
      cell: (info) => info.getValue() || 'N/A',
    },
    {
      accessorKey: 'alarm_type',
      header: 'Alarm Type',
      cell: (info) => {
        const alarmType = info.getValue() as string;
        const getAlarmIcon = (type: string) => {
          switch (type) {
            case 'sim_card_change': return '📱';
            case 'device_offline': return '🔴';
            case 'device_online': return '🟢';
            case 'battery_low': return '🔋';
            case 'signal_low': return '📶';
            default: return '⚠️';
          }
        };
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{getAlarmIcon(alarmType)}</span>
            <Badge variant="outline" className="text-xs">
              {alarmType.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: (info) => {
        const message = info.getValue() as string;
        return (
          <div className="max-w-[200px] truncate" title={message}>
            {message}
          </div>
        );
      },
    },
    {
      accessorKey: 'battery_level',
      header: 'Battery',
      cell: (info) => {
        const batteryLevel = info.getValue() as number;
        const batteryStatus = info.row.original.battery_status as string;
        
        if (batteryLevel === null || batteryLevel === undefined || batteryLevel === 0) {
          return <span className="text-muted-foreground">N/A</span>;
        }
        
        const getBatteryColor = (level: number) => {
          if (level <= 20) return 'text-red-500';
          if (level <= 50) return 'text-yellow-500';
          return 'text-green-500';
        };
        
        const getBatteryIcon = (status: string) => {
          if (status?.includes('charging')) return '🔌';
          if (status?.includes('discharging')) return '🔋';
          if (status?.includes('full')) return '🔋';
          return '🔋';
        };
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{getBatteryIcon(batteryStatus)}</span>
            <div className="flex-1 min-w-[40px]">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${getBatteryColor(batteryLevel)}`}
                  style={{ width: `${batteryLevel}%` }}
                ></div>
              </div>
            </div>
            <span className={`text-xs font-medium ${getBatteryColor(batteryLevel)}`}>
              {batteryLevel}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'signal_strength',
      header: 'Signal',
      cell: (info) => {
        const signalStrength = info.getValue() as number;
        const signalDbm = info.row.original.signal_dbm as number;
        const networkType = info.row.original.network_type as string;
        
        if (signalStrength === null || signalStrength === undefined || signalStrength === 0) {
          return <span className="text-muted-foreground">N/A</span>;
        }
        
        const getSignalColor = (strength: number) => {
          if (strength >= 4) return 'text-green-500';
          if (strength >= 2) return 'text-yellow-500';
          return 'text-red-500';
        };
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">📶</span>
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${getSignalColor(signalStrength)}`}>
                {signalStrength}/5
              </span>
              {signalDbm && signalDbm > 0 && (
                <span className="text-xs text-muted-foreground">
                  {signalDbm} dBm
                </span>
              )}
              {networkType && (
                <span className="text-xs text-muted-foreground">
                  {networkType}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: (info) => {
        const severity = info.getValue() as string;
        const getSeverityColor = (sev: string) => {
          switch (sev) {
            case 'critical': return 'destructive';
            case 'error': return 'destructive';
            case 'warning': return 'default';
            case 'info': return 'secondary';
            default: return 'secondary';
          }
        };
        return (
          <Badge variant={getSeverityColor(severity) as any} className="text-xs">
            {severity.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue() as string;
        const getStatusColor = (stat: string) => {
          switch (stat) {
            case 'started': return 'default';
            case 'stopped': return 'secondary';
            case 'failed': return 'destructive';
            default: return 'secondary';
          }
        };
        return (
          <Badge variant={getStatusColor(status) as any} className="text-xs">
            {status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: (info) => new Date(info.getValue() as string).toLocaleString(),
    },
  ], []);

  // Table instance for devices
  const deviceTable = useReactTable({
    data: filteredDevices,
    columns: deviceColumns,
    state: {
      rowSelection,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    getRowId: row => row.imei,
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Table instance for alarm logs
  const alarmLogTable = useReactTable({
    data: filteredAlarmLogs,
    columns: alarmLogColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: row => row.id.toString(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Toplu işlemler
  const selectedImeis = deviceTable.getSelectedRowModel().rows.map(r => r.original.imei);

  const handleDelete = async (imeis: string[]) => {
    if (imeis.length === 0) return;
    if (!window.confirm('Are you sure you want to delete selected devices?')) return;
    try {
      for (const imei of imeis) {
        await fetch(`/api/devices/${imei}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      toast.success('Devices deleted');
      setRowSelection({});
    } catch {
      toast.error('Failed to delete devices');
    }
  };

  const handleToggleActive = async (imeis: string[], active: boolean) => {
    if (imeis.length === 0) return;
    try {
      for (const imei of imeis) {
        await fetch(`/api/devices/${imei}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: active ? 'ENABLE' : 'DISABLE' })
        });
      }
      toast.success(`Devices ${active ? 'enabled' : 'disabled'}`);
      setRowSelection({});
    } catch {
      toast.error('Failed to update devices');
    }
  };

  const handleExitMaintenanceMode = async (imeis: string[]) => {
    if (imeis.length === 0) return;
    try {
      for (const imei of imeis) {
        await fetch(`/api/devices/${imei}/maintenance/exit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
      toast.success('Devices exited maintenance mode');
      setRowSelection({});
      fetchDevices(); // Refresh devices to update maintenance status
    } catch (error) {
      console.error('Error exiting maintenance mode:', error);
      toast.error('Failed to exit maintenance mode');
    }
  };

  const handleEnterMaintenanceMode = async (imeis: string[], reason: string) => {
    if (imeis.length === 0) return;
    try {
      for (const imei of imeis) {
        await fetch(`/api/devices/${imei}/maintenance/enter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        });
      }
      toast.success('Devices entered maintenance mode');
      setRowSelection({});
      fetchDevices(); // Refresh devices to update maintenance status
    } catch (error) {
      console.error('Error entering maintenance mode:', error);
      toast.error('Failed to enter maintenance mode');
    }
  };

  const handleClearFilters = () => {
    setGlobalFilter('');
    setSitenameFilter('all');
    setDeviceGroupFilter('all');
    setStatusFilter('all');
    setOnlineFilter('all');
    setMaintenanceFilter('all');
  };

  const handleClearAlarmFilters = () => {
    setAlarmDeviceFilter('all');
    setAlarmTypeFilter('all');
    setAlarmSeverityFilter('all');
    setAlarmStatusFilter('all');
    setAlarmSitenameFilter('all');
    setAlarmDeviceGroupFilter('all');
  };

  const handleClearAlarmLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all alarm logs? This action cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/alarm-logs', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('All alarm logs cleared successfully');
        fetchAlarmLogs(); // Refresh the list
      } else {
        toast.error('Failed to clear alarm logs');
      }
    } catch (error) {
      console.error('Error clearing alarm logs:', error);
      toast.error('Failed to clear alarm logs');
    }
  };

  const handleRename = async () => {
    if (!selectedDevice || !newDeviceName.trim()) return;
    
    setRenaming(true);
    try {
      const response = await fetch(`/api/devices/${selectedDevice.imei}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeviceName.trim() })
      });

      if (response.ok) {
        toast.success('Device renamed successfully');
        setRenameDialogOpen(false);
        setSelectedDevice(null);
        setNewDeviceName('');
        // Refresh devices list
        fetchDevices();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to rename device');
      }
    } catch (error) {
      console.error('Error renaming device:', error);
      toast.error('Failed to rename device');
    } finally {
      setRenaming(false);
    }
  };

  const openRenameDialog = (device: Device) => {
    setSelectedDevice(device);
    setNewDeviceName(device.name || '');
    setRenameDialogOpen(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDevices}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-muted-foreground">Manage and monitor your connected devices</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {ws.isConnected ? 'WebSocket Connected - Real-time updates active' : 'WebSocket Disconnected - Manual refresh required'}
              </span>
            </div>
          </div>
          {selectedImeis.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {selectedImeis.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(selectedImeis)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(selectedImeis, true)}
              >
                <Check className="mr-2 h-4 w-4" /> Enable Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(selectedImeis, false)}
              >
                <X className="mr-2 h-4 w-4" /> Disable Selected
              </Button>
              {selectedImeis.some(imei => {
                const device = devices.find(d => d.imei === imei);
                return device?.maintenance_mode;
              }) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExitMaintenanceMode(selectedImeis)}
                >
                  <Wrench className="mr-2 h-4 w-4" /> Exit Maintenance Mode
                </Button>
              )}
              {selectedImeis.some(imei => {
                const device = devices.find(d => d.imei === imei);
                return !device?.maintenance_mode;
              }) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMaintenanceImeis(selectedImeis);
                    setMaintenanceDialogOpen(true);
                  }}
                >
                  <Wrench className="mr-2 h-4 w-4" /> Enter Maintenance Mode
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Device Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deviceStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All registered devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deviceStats.online}</div>
              <div className="flex items-center gap-2">
                <Progress value={deviceStats.onlinePercentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{deviceStats.onlinePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{deviceStats.active}</div>
              <div className="flex items-center gap-2">
                <Progress value={deviceStats.activePercentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{deviceStats.activePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
              <Signal className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{deviceStats.offline}</div>
              <p className="text-xs text-muted-foreground">
                {deviceStats.inactive} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Mode</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{deviceStats.maintenance}</div>
              <p className="text-xs text-muted-foreground">
                devices in maintenance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Devices and Alarm Logs */}
        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Devices ({filteredDevices.length})
            </TabsTrigger>
            <TabsTrigger value="alarms" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alarm Logs ({filteredAlarmLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            {/* Devices Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Device Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="relative">
                    <Input
                      placeholder="Search devices..."
                      value={globalFilter}
                      onChange={e => setGlobalFilter(e.target.value)}
                      className="w-full"
                      size={32}
                    />
                  </div>
                  
                  <Select value={sitenameFilter} onValueChange={setSitenameFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Sitenames" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sitenames</SelectItem>
                      {uniqueSitenames.map((sitename) => (
                        <SelectItem key={sitename} value={sitename}>
                          {sitename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={deviceGroupFilter} onValueChange={setDeviceGroupFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {uniqueDeviceGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Online Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Online Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={maintenanceFilter} onValueChange={setMaintenanceFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Maintenance Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="flex items-center gap-2">
                        <Wrench className="h-3 w-3" />
                        All Maintenance Status
                      </SelectItem>
                      <SelectItem value="active" className="flex items-center gap-2">
                        <Wrench className="h-3 w-3 text-orange-500" />
                        In Maintenance
                      </SelectItem>
                      <SelectItem value="inactive" className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        Not in Maintenance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Devices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        {deviceTable.getHeaderGroups().map(headerGroup => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                              <th key={header.id} className="border-b px-4 py-2 text-left bg-muted/50">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {deviceTable.getRowModel().rows?.length ? (
                          deviceTable.getRowModel().rows.map(row => (
                            <tr key={row.id} className="border-b hover:bg-muted/50">
                              {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={deviceColumns.length} className="h-24 text-center">
                              No devices found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {deviceTable.getFilteredSelectedRowModel().rows.length} of{" "}
                    {deviceTable.getFilteredRowModel().rows.length} row(s) selected.
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deviceTable.previousPage()}
                      disabled={!deviceTable.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deviceTable.nextPage()}
                      disabled={!deviceTable.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            {/* Alarm Logs Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Alarm Log Filters
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAlarmLogs}
                    disabled={alarmLogsLoading}
                  >
                    Clear All Logs
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select value={alarmDeviceFilter} onValueChange={setAlarmDeviceFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Devices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Devices</SelectItem>
                      {uniqueAlarmDevices.map((device) => (
                        <SelectItem key={device} value={device}>
                          {device}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={alarmTypeFilter} onValueChange={setAlarmTypeFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueAlarmTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={alarmSeverityFilter} onValueChange={setAlarmSeverityFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      {uniqueAlarmSeverities.map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {severity.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={alarmStatusFilter} onValueChange={setAlarmStatusFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueAlarmStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={alarmSitenameFilter} onValueChange={setAlarmSitenameFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Sitenames" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sitenames</SelectItem>
                      {uniqueAlarmSitenames.map((sitename) => (
                        <SelectItem key={sitename} value={sitename}>
                          {sitename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={alarmDeviceGroupFilter} onValueChange={setAlarmDeviceGroupFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {uniqueAlarmDeviceGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAlarmFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alarm Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Alarm Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        {alarmLogTable.getHeaderGroups().map(headerGroup => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                              <th key={header.id} className="border-b px-4 py-2 text-left bg-muted/50">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {alarmLogTable.getRowModel().rows?.length ? (
                          alarmLogTable.getRowModel().rows.map(row => (
                            <tr key={row.id} className="border-b hover:bg-muted/50">
                              {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={alarmLogColumns.length} className="h-24 text-center">
                              No alarm logs found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Showing {alarmLogTable.getFilteredRowModel().rows.length} of {alarmLogs.length} alarm logs.
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alarmLogTable.previousPage()}
                      disabled={!alarmLogTable.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alarmLogTable.nextPage()}
                      disabled={!alarmLogTable.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rename Device Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Device</DialogTitle>
              <DialogDescription>
                Enter a new name for the device "{selectedDevice?.name}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Enter device name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={renaming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={renaming || !newDeviceName.trim()}
              >
                {renaming ? 'Renaming...' : 'Rename'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Maintenance Mode Dialog */}
        <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Maintenance Mode</DialogTitle>
              <DialogDescription>
                Enter maintenance mode for {maintenanceImeis.length} selected device(s). Enter a reason for the maintenance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenance-reason">Maintenance Reason</Label>
                <Input
                  id="maintenance-reason"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="e.g., Firmware update, Hardware issue, SIM card replacement"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setMaintenanceDialogOpen(false);
                  setMaintenanceReason('');
                  setMaintenanceImeis([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleEnterMaintenanceMode(maintenanceImeis, maintenanceReason);
                  setMaintenanceDialogOpen(false);
                  setMaintenanceReason('');
                  setMaintenanceImeis([]);
                }}
                disabled={!maintenanceReason.trim()}
              >
                Enter Maintenance Mode
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 