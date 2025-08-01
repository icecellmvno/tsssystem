import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useWebSocket } from '@/contexts/websocket-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Trash2, 
  Power, 
  Wrench, 
  AlertTriangle,
  Smartphone,
  Activity,
  X,
  MessageSquare
} from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Components
import { DeviceStats } from '@/components/devices/device-stats';
import { DeviceFilters } from '@/components/devices/device-filters';
import { createDeviceColumns } from '@/components/devices/device-table-columns';
import { alarmLogsColumns } from '@/components/devices/alarm-logs-table-columns';

// Services
import { deviceService, type Device, type AlarmLog, type DeviceStats as DeviceStatsType } from '@/services/devices';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Devices', href: '/devices' },
];

export default function DevicesIndex() {
  const ws = useWebSocket();
  
  // State
  const [devices, setDevices] = useState<Device[]>([]);
  const [alarmLogs, setAlarmLogs] = useState<AlarmLog[]>([]);
  const [apiDevices, setApiDevices] = useState<Device[]>([]); // API'den gelen veriler
  const [apiAlarmLogs, setApiAlarmLogs] = useState<AlarmLog[]>([]); // API'den gelen alarm logları
  const [stats, setStats] = useState<DeviceStatsType>({
    total: 0,
    active: 0,
    inactive: 0,
    online: 0,
    offline: 0,
    maintenance: 0,
    ready: 0,
    alarm: 0
  });
  const [loading, setLoading] = useState(true);
  const [alarmLogsLoading, setAlarmLogsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filter states
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [countrySiteFilter, setCountrySiteFilter] = useState('all');
  const [deviceGroupFilter, setDeviceGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [maintenanceFilter, setMaintenanceFilter] = useState('all');
  
  // Alarm logs filter states
  const [alarmGlobalFilter, setAlarmGlobalFilter] = useState('');
  const [alarmDeviceFilter, setAlarmDeviceFilter] = useState('all');
  const [alarmTypeFilter, setAlarmTypeFilter] = useState('all');
  const [alarmSeverityFilter, setAlarmSeverityFilter] = useState('all');
  const [alarmStatusFilter, setAlarmStatusFilter] = useState('all');
  
  // Dialog states
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedAlarmLogs, setSelectedAlarmLogs] = useState<string[]>([]);
  const [renameDevice, setRenameDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [maintenanceDevice, setMaintenanceDevice] = useState<Device | null>(null);

  // Fetch data functions
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await deviceService.getDevices({
        search: debouncedGlobalFilter || undefined,
        country_site: countrySiteFilter !== 'all' ? countrySiteFilter : undefined,
        device_group: deviceGroupFilter !== 'all' ? deviceGroupFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        online: onlineFilter !== 'all' ? onlineFilter : undefined,
        maintenance: maintenanceFilter !== 'all' ? maintenanceFilter : undefined,
      });
      
      setApiDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlarmLogs = async () => {
    try {
      setAlarmLogsLoading(true);
      const response = await deviceService.getAlarmLogs({
        search: alarmGlobalFilter || undefined,
        device_id: alarmDeviceFilter !== 'all' ? alarmDeviceFilter : undefined,
        alarm_type: alarmTypeFilter !== 'all' ? alarmTypeFilter : undefined,
        severity: alarmSeverityFilter !== 'all' ? alarmSeverityFilter : undefined,
        status: alarmStatusFilter !== 'all' ? alarmStatusFilter : undefined,
      });
      
      setApiAlarmLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching alarm logs:', error);
      toast.error('Failed to fetch alarm logs');
    } finally {
      setAlarmLogsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await deviceService.getDeviceStats();
      setStats(response || {
        total: 0,
        active: 0,
        inactive: 0,
        online: 0,
        offline: 0,
        maintenance: 0,
        ready: 0,
        alarm: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch device statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Action handlers
  const handleDelete = async () => {
    try {
      await deviceService.deleteDevices(selectedDevices);
      toast.success('Devices deleted successfully');
      setSelectedDevices([]);
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error deleting devices:', error);
      toast.error('Failed to delete devices');
    }
  };

  const handleToggleActive = async (active: boolean) => {
    try {
      await deviceService.toggleDeviceActive(selectedDevices, active);
      toast.success(`Devices ${active ? 'activated' : 'deactivated'} successfully`);
      setSelectedDevices([]);
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error toggling device status:', error);
      toast.error('Failed to update device status');
    }
  };

  const handleEnterMaintenanceMode = async () => {
    if (!maintenanceReason.trim()) {
      toast.error('Please provide a maintenance reason');
      return;
    }

    try {
      await deviceService.enterMaintenanceMode(selectedDevices, maintenanceReason);
      toast.success('Devices put into maintenance mode');
      setSelectedDevices([]);
      setMaintenanceReason('');
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error entering maintenance mode:', error);
      toast.error('Failed to enter maintenance mode');
    }
  };



  const handleRename = async (device?: Device) => {
    if (device) {
      // Set the device to rename and pre-fill the name
      setRenameDevice(device);
      setNewDeviceName(device.name);
    } else {
      // This is called from the dialog button
    if (!renameDevice || !newDeviceName.trim()) {
      toast.error('Please provide a device name');
      return;
    }

    try {
      await deviceService.renameDevice(renameDevice.imei, newDeviceName);
      toast.success('Device renamed successfully');
      setRenameDevice(null);
      setNewDeviceName('');
      fetchDevices();
    } catch (error) {
      console.error('Error renaming device:', error);
      toast.error('Failed to rename device');
      }
    }
  };

  const handleEnterMaintenance = async (device?: Device) => {
    if (device) {
      // Set the device for maintenance mode
      setMaintenanceDevice(device);
      setMaintenanceReason('');
    } else {
      // This is called from the dialog button
      if (!maintenanceDevice || !maintenanceReason.trim()) {
        toast.error('Please provide a maintenance reason');
        return;
      }

      try {
        await deviceService.enterMaintenanceMode([maintenanceDevice.imei], maintenanceReason);
        toast.success('Device put into maintenance mode');
        setMaintenanceDevice(null);
        setMaintenanceReason('');
        fetchDevices();
        fetchStats();
      } catch (error) {
        console.error('Error entering maintenance mode:', error);
        toast.error('Failed to enter maintenance mode');
      }
    }
  };

  const handleExitMaintenance = async (device?: Device) => {
    if (device) {
      // Direct exit maintenance mode for single device
      try {
        await deviceService.exitMaintenanceMode([device.imei]);
        toast.success('Device exited maintenance mode');
        fetchDevices();
        fetchStats();
      } catch (error) {
        console.error('Error exiting maintenance mode:', error);
        toast.error('Failed to exit maintenance mode');
      }
    } else {
      // Bulk exit maintenance mode for selected devices
      if (selectedDevices.length === 0) {
        toast.error('Please select devices to exit maintenance mode');
        return;
      }

      try {
        await deviceService.exitMaintenanceMode(selectedDevices);
        toast.success('Devices exited maintenance mode');
        setSelectedDevices([]);
        fetchDevices();
        fetchStats();
      } catch (error) {
        console.error('Error exiting maintenance mode:', error);
        toast.error('Failed to exit maintenance mode');
      }
    }
  };

  const handleClearAlarmLogs = async () => {
    try {
      await deviceService.clearAlarmLogs();
      toast.success('Alarm logs cleared successfully');
      fetchAlarmLogs();
    } catch (error) {
      console.error('Error clearing alarm logs:', error);
      toast.error('Failed to clear alarm logs');
    }
  };

  const handleDeleteSelectedAlarmLogs = async () => {
    try {
      // Note: This would need to be implemented in the backend
      // For now, we'll just clear all logs
      await deviceService.clearAlarmLogs();
      toast.success('Selected alarm logs deleted successfully');
      setSelectedAlarmLogs([]);
      fetchAlarmLogs();
    } catch (error) {
      console.error('Error deleting selected alarm logs:', error);
      toast.error('Failed to delete selected alarm logs');
    }
  };

  const handleClearFilters = () => {
    setGlobalFilter('');
    setCountrySiteFilter('all');
    setDeviceGroupFilter('all');
    setStatusFilter('all');
    setOnlineFilter('all');
    setMaintenanceFilter('all');
  };

  const handleClearAlarmFilters = () => {
    setAlarmGlobalFilter('');
    setAlarmDeviceFilter('all');
    setAlarmTypeFilter('all');
    setAlarmSeverityFilter('all');
    setAlarmStatusFilter('all');
  };

  const handleBulkUpdateSmsLimits = async () => {
    try {
      const response = await deviceService.bulkUpdateSmsLimitData();
      if (response.success) {
        toast.success('SMS limit data updated successfully for all devices');
        fetchDevices(); // Refresh devices to show updated data
      }
    } catch (error) {
      console.error('Error updating SMS limit data:', error);
      toast.error('Failed to update SMS limit data');
    }
  };

  // Computed values
  const countrySites = useMemo(() => {
    if (!devices || devices.length === 0) return [];
    const uniqueSites = [...new Set(devices.map(device => device.country_site))];
    // Boş string değerleri filtrele
    return uniqueSites.filter(site => site && site.trim() !== '').sort();
  }, [devices]);

  const deviceGroups = useMemo(() => {
    if (!devices || devices.length === 0) return [];
    const uniqueGroups = [...new Set(devices.map(device => device.device_group))];
    // Boş string değerleri filtrele
    return uniqueGroups.filter(group => group && group.trim() !== '').sort();
  }, [devices]);

  // Real-time stats calculation
  const realTimeStats = useMemo(() => {
    if (!devices || devices.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        online: 0,
        offline: 0,
        maintenance: 0,
        ready: 0,
        alarm: 0
      };
    }

    const total = devices.length;
    const active = devices.filter(d => d.is_active).length;
    const inactive = devices.filter(d => !d.is_active).length;
    const online = devices.filter(d => d.is_online).length;
    const offline = devices.filter(d => !d.is_online).length;
    const maintenance = devices.filter(d => d.maintenance_mode).length;
    
    // Ready devices: active, online, not in maintenance, no alarms
    const ready = devices.filter(d => 
      d.is_active && 
      d.is_online && 
      !d.maintenance_mode && 
      (!d.alarms || d.alarms.length === 0)
    ).length;
    
    // Alarm devices: devices with active alarms
    const alarm = devices.filter(d => 
      d.alarms && 
      d.alarms.some(alarm => 
        alarm.status === 'started' && 
        ['critical', 'error', 'warning'].includes(alarm.severity)
      )
    ).length;

    return {
      total,
      active,
      inactive,
      online,
      offline,
      maintenance,
      ready,
      alarm
    };
  }, [devices]);

  const alarmDevices = useMemo(() => {
    if (!alarmLogs || alarmLogs.length === 0) return [];
    const uniqueDevices = [...new Set(alarmLogs.map(log => log.device_id))];
    // Boş string değerleri filtrele
    return uniqueDevices.filter(device => device && device.trim() !== '').sort();
  }, [alarmLogs]);

  const alarmTypes = useMemo(() => {
    if (!alarmLogs || alarmLogs.length === 0) return [];
    const uniqueTypes = [...new Set(alarmLogs.map(log => log.alarm_type))];
    // Boş string değerleri filtrele
    return uniqueTypes.filter(type => type && type.trim() !== '').sort();
  }, [alarmLogs]);

  // Effects
  useEffect(() => {
    fetchDevices();
    fetchAlarmLogs();
    fetchStats();
  }, []);

  // Debounce global filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  useEffect(() => {
    fetchDevices();
  }, [debouncedGlobalFilter, countrySiteFilter, deviceGroupFilter, statusFilter, onlineFilter, maintenanceFilter]);

  useEffect(() => {
    fetchAlarmLogs();
  }, [alarmGlobalFilter, alarmDeviceFilter, alarmTypeFilter, alarmSeverityFilter, alarmStatusFilter]);

  // WebSocket effect - API verileriyle WebSocket verilerini merge et
  useEffect(() => {
    const wsDevices = ws.devices || [];
    const apiDevicesData = apiDevices || [];
    
    if (wsDevices.length > 0 || apiDevicesData.length > 0) {
      // Sadece geçerli IMEI'si olan WebSocket cihazlarını filtrele
      const validWsDevices = wsDevices.filter(wsDevice => 
        wsDevice.imei && wsDevice.imei.trim() !== '' && wsDevice.imei !== 'null' && wsDevice.imei !== 'undefined'
      );
      
      // API verilerini WebSocket verileriyle merge et
      const mergedDevices = apiDevicesData.map(apiDevice => {
        const wsDevice = validWsDevices.find(wsDevice => wsDevice.imei === apiDevice.imei);
        return wsDevice ? { ...apiDevice, ...wsDevice } : apiDevice;
      });
      
      // WebSocket'te olup API'de olmayan cihazları ekle (sadece geçerli IMEI'li olanlar)
      const wsOnlyDevices = validWsDevices.filter(wsDevice => 
        !apiDevicesData.find(apiDevice => apiDevice.imei === wsDevice.imei)
      );
      
      // Son olarak tüm cihazları filtrele - sadece geçerli IMEI'si olanları göster
      const allDevices = [...mergedDevices, ...wsOnlyDevices];
      const finalDevices = allDevices.filter(device => 
        device.imei && device.imei.trim() !== '' && device.imei !== 'null' && device.imei !== 'undefined'
      );
      
      setDevices(finalDevices);
    }
  }, [ws.devices, apiDevices]);

  // WebSocket alarm logs effect - API verileriyle WebSocket verilerini merge et
  useEffect(() => {
    const wsAlarmLogs = ws.alarmLogs || [];
    const apiAlarmLogsData = apiAlarmLogs || [];
    
    if (wsAlarmLogs.length > 0 || apiAlarmLogsData.length > 0) {
      // Sadece geçerli device_id'si olan WebSocket alarm loglarını filtrele
      const validWsAlarmLogs = wsAlarmLogs.filter(log => 
        log.device_id && log.device_id.trim() !== '' && log.device_id !== 'null' && log.device_id !== 'undefined'
      );
      
      // API ve WebSocket alarm loglarını birleştir
      const mergedAlarmLogs = [...apiAlarmLogsData, ...validWsAlarmLogs];
      
      // Duplicate'ları temizle (id ve created_at'e göre)
      const uniqueAlarmLogs = mergedAlarmLogs.filter((log, index, self) => 
        index === self.findIndex(l => 
          l.id === log.id && l.created_at === log.created_at
        )
      );
      
      // Son olarak tüm alarm loglarını filtrele - sadece geçerli device_id'si olanları göster
      const finalAlarmLogs = uniqueAlarmLogs.filter(log => 
        log.device_id && log.device_id.trim() !== '' && log.device_id !== 'null' && log.device_id !== 'undefined'
      );
      
      setAlarmLogs(finalAlarmLogs);
    }
  }, [ws.alarmLogs, apiAlarmLogs]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
                {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
            <p className="text-muted-foreground">
              Manage and monitor your devices in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUpdateSmsLimits}
              disabled={loading}
              title="Update SMS limit data for all devices"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Update SMS Limits
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // API verilerini yenile (WebSocket verileri gerçek zamanlı güncelleniyor)
                fetchDevices();
                fetchAlarmLogs();
                fetchStats();
              }}
              disabled={loading || alarmLogsLoading || statsLoading}
              title="Refresh API data (WebSocket data updates in real-time)"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

                {/* Status Legend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-medium text-muted-foreground">Status:</span>
            <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
              🟢 Ready
            </Badge>
            <Badge variant="secondary" className="text-xs bg-yellow-500 text-white hover:bg-yellow-600">
              🟡 Maintenance
            </Badge>
            <Badge variant="destructive" className="text-xs">
              🔴 Alarm
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Connection:</span>
            <Badge 
              variant={ws.isConnected ? "default" : "destructive"} 
              className={`text-xs ${ws.isConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {ws.isConnected ? '🟢 WebSocket Connected' : '🔴 WebSocket Disconnected'}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <DeviceStats stats={realTimeStats} loading={loading} />

        {/* Tabs */}
        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Devices ({devices?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="alarms" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alarm Logs ({alarmLogs?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            {/* Device Filters */}
            <DeviceFilters
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              countrySiteFilter={countrySiteFilter}
              setCountrySiteFilter={setCountrySiteFilter}
              deviceGroupFilter={deviceGroupFilter}
              setDeviceGroupFilter={setDeviceGroupFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onlineFilter={onlineFilter}
              setOnlineFilter={setOnlineFilter}
              maintenanceFilter={maintenanceFilter}
              setMaintenanceFilter={setMaintenanceFilter}
              onClearFilters={handleClearFilters}
              onRefresh={() => {
                // API verilerini yenile (WebSocket verileri gerçek zamanlı güncelleniyor)
                fetchDevices();
                fetchStats();
              }}
              countrySites={countrySites}
              deviceGroups={deviceGroups}
              loading={loading}
            />

            {/* Device Actions */}
            {selectedDevices.length > 0 && (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedDevices.length} device(s) selected
                </span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedDevices.length} / {devices.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDevices([])}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(true)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(false)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Disable All
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4 mr-2" />
                        Enter Maintenance
                  </Button>
                    </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Maintenance Mode</DialogTitle>
              <DialogDescription>
                          Enter a reason for putting {selectedDevices.length} device(s) into maintenance mode.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                          <Label htmlFor="bulk-maintenance-reason">Reason</Label>
                <Input
                            id="bulk-maintenance-reason"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                            placeholder="Enter maintenance reason..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEnterMaintenanceMode();
                              }
                            }}
                />
              </div>
            </div>
            <DialogFooter>
                        <Button variant="outline" onClick={() => setMaintenanceReason('')}>
                          Cancel
                        </Button>
                        <Button onClick={handleEnterMaintenanceMode}>
                Enter Maintenance Mode
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExitMaintenance()}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Exit Maintenance
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Devices</AlertDialogTitle>
              <AlertDialogDescription>
                          Are you sure you want to delete {selectedDevices.length} device(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
                </div>
              </div>
            )}

            {/* Device Table */}
            <DataTable
              data={devices || []}
              columns={createDeviceColumns(handleRename, handleEnterMaintenance, handleExitMaintenance)}
              loading={loading}
              showRowSelection={true}
              onRowSelectionChange={setSelectedDevices}
              selectedRows={selectedDevices}
              rowSelectionKey="imei"
              showSearch={false}
              filters={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allDeviceIds = devices.map(device => device.imei);
                      if (selectedDevices.length === allDeviceIds.length) {
                        // If all are selected, clear selection
                        setSelectedDevices([]);
                      } else {
                        // Otherwise, select all
                        setSelectedDevices(allDeviceIds);
                      }
                    }}
                    disabled={devices.length === 0}
                  >
                    {selectedDevices.length === devices.length ? 'Clear All' : `Select All (${devices.length})`}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDevices([])}
                    disabled={selectedDevices.length === 0}
                  >
                    Clear Selection
                  </Button>
                  {selectedDevices.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedDevices.length} selected
                    </Badge>
                  )}
                </div>
              }
            />
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            {/* Alarm Logs Bulk Actions */}
            {selectedAlarmLogs.length > 0 && (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedAlarmLogs.length} alarm log(s) selected
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedAlarmLogs.length} / {alarmLogs.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAlarmLogs([])}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Alarm Logs</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedAlarmLogs.length} alarm log(s)? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedAlarmLogs}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* Alarm Logs Table */}
            <DataTable
              data={alarmLogs || []}
              columns={alarmLogsColumns}
              loading={alarmLogsLoading}
              showSearch={true}
              searchPlaceholder="Search alarm logs..."
              globalFilter={alarmGlobalFilter}
              onGlobalFilterChange={setAlarmGlobalFilter}
              showRowSelection={true}
              onRowSelectionChange={setSelectedAlarmLogs}
              selectedRows={selectedAlarmLogs}
              rowSelectionKey="id"
              title={`Alarm Logs (Last 50 Records - ${alarmLogs?.length || 0} shown)`}
              showPagination={false}
              filters={
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Device</label>
                <select
                  value={alarmDeviceFilter}
                  onChange={(e) => setAlarmDeviceFilter(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm border border-input rounded-md"
                >
                  <option value="all">All devices</option>
                  {alarmDevices.map((device) => (
                    <option key={device} value={device || 'unknown'}>
                      {device || 'Unknown Device'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alarm Type</label>
                <select
                  value={alarmTypeFilter}
                  onChange={(e) => setAlarmTypeFilter(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm border border-input rounded-md"
                >
                  <option value="all">All types</option>
                  {alarmTypes.map((type) => (
                    <option key={type} value={type || 'unknown'}>
                      {(type || 'Unknown Type').replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <select
                  value={alarmSeverityFilter}
                  onChange={(e) => setAlarmSeverityFilter(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm border border-input rounded-md"
                >
                  <option value="all">All severities</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={alarmStatusFilter}
                  onChange={(e) => setAlarmStatusFilter(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm border border-input rounded-md"
                >
                  <option value="all">All statuses</option>
                  <option value="started">Started</option>
                  <option value="stopped">Stopped</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

                            <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAlarmFilters}
                    className="flex-1"
                  >
                    Clear Filters
                  </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selection</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allAlarmLogIds = alarmLogs.map(log => log.id.toString());
                          setSelectedAlarmLogs(allAlarmLogIds);
                        }}
                        disabled={alarmLogs.length === 0}
                      >
                        Select All ({alarmLogs.length})
                      </Button>
                  <Button
                        variant="outline"
                    size="sm"
                        onClick={() => setSelectedAlarmLogs([])}
                        disabled={selectedAlarmLogs.length === 0}
                  >
                        Clear Selection
                  </Button>
                </div>
              </div>
            </div>
              }
            />
          </TabsContent>
        </Tabs>

        {/* Rename Device Dialog */}
        <Dialog open={!!renameDevice} onOpenChange={() => setRenameDevice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Device</DialogTitle>
              <DialogDescription>
                Enter a new name for device {renameDevice?.imei}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Enter device name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDevice(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleRename()}>
                Rename Device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Maintenance Mode Dialog */}
        <Dialog open={!!maintenanceDevice} onOpenChange={() => setMaintenanceDevice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Maintenance Mode</DialogTitle>
              <DialogDescription>
                Enter a reason for putting device {maintenanceDevice?.imei} into maintenance mode.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenance-reason">Maintenance Reason</Label>
                <Input
                  id="maintenance-reason"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="Enter maintenance reason..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEnterMaintenance();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMaintenanceDevice(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleEnterMaintenance()}>
                Enter Maintenance Mode
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 