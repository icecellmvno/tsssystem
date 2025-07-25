import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle, Edit, Trash2, Copy, MessageSquare, Phone, Search, Bell, Power, Smartphone, Wrench } from 'lucide-react';
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

interface Props {
  device?: Device;
  simInfo?: any;
}

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
        device.android_version !== wsDevice.android_version;

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
            last_seen: new Date().toISOString(),
          };
        });
      }

      // Update SIM info only if it actually changes
      if (wsDevice.sim_cards && wsDevice.sim_cards.length > 0) {
        const simInfoData = {
          sims: wsDevice.sim_cards.map((sim: any, index: number) => ({
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
          }))
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
        body: JSON.stringify(data)
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
                      title: 'Country Management',
      href: '#',
    },
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="sims">SIM Cards</TabsTrigger>
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
                    <div className="text-sm">{device.sitename || 'Not assigned'}</div>
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
                <CardTitle>Location Information</CardTitle>
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
                      {device.battery_level !== null && device.battery_level !== undefined && device.battery_level > 0 ? `${device.battery_level}%` : 'Unknown'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Battery Status</div>
                    <div className="text-sm">{device.battery_status || 'Unknown'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Signal Strength</div>
                    <div className="text-sm">{device.signal_strength}/5 ({device.signal_dbm} dBm)</div>
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
                      <Card key={sim.slot}>
                        <CardHeader>
                          <CardTitle className="text-lg">SIM {sim.slot}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Status</div>
                            <Badge variant={sim.is_active ? "default" : "secondary"}>
                              {sim.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
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
                            <div className="text-sm">{sim.network_type}</div>
                          </div>
                          <div className="space-y-2 mt-4">
                            <div className="text-sm font-medium">Signal Strength</div>
                            <div className="text-sm">
                              {sim.signal_level === 5 ? "Excellent" :
                               sim.signal_level === 4 ? "Good" :
                               sim.signal_level === 3 ? "Fair" :
                               sim.signal_level === 2 ? "Poor" :
                               sim.signal_level === 1 ? "Very Poor" : "Unknown"} ({sim.signal_level}/5)
                              {sim.signal_dbm && ` (${sim.signal_dbm} dBm)`}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <div className="text-sm text-muted-foreground">No SIM information available</div>
                  </div>
                )}
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