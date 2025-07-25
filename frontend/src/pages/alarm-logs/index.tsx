import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, Search, ArrowUpDown, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

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
  { title: 'Reports', href: '#' },
  { title: 'Alarm Logs', href: '/alarm-logs' },
];

export default function AlarmLogsIndex() {
  const { token } = useAuthStore();
  const [alarmLogs, setAlarmLogs] = useState<AlarmLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [globalFilter, setGlobalFilter] = useState('');
  const [alarmDeviceFilter, setAlarmDeviceFilter] = useState('all');
  const [alarmTypeFilter, setAlarmTypeFilter] = useState('all');
  const [alarmSeverityFilter, setAlarmSeverityFilter] = useState('all');
  const [alarmStatusFilter, setAlarmStatusFilter] = useState('all');
  const [alarmSitenameFilter, setAlarmSitenameFilter] = useState('all');
  const [alarmDeviceGroupFilter, setAlarmDeviceGroupFilter] = useState('all');

  // Fetch alarm logs from API
  const fetchAlarmLogs = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAlarmLogs();
  }, []);

  // Get unique alarm log filters
  const uniqueAlarmDevices = useMemo(() => {
    const deviceNames = alarmLogs?.map(a => a.device_name).filter(Boolean) || [];
    return [...new Set(deviceNames)];
  }, [alarmLogs]);

  const uniqueAlarmTypes = useMemo(() => {
    const types = alarmLogs?.map(a => a.alarm_type).filter(Boolean) || [];
    return [...new Set(types)];
  }, [alarmLogs]);

  const uniqueAlarmSeverities = useMemo(() => {
    const severities = alarmLogs?.map(a => a.severity).filter(Boolean) || [];
    return [...new Set(severities)];
  }, [alarmLogs]);

  const uniqueAlarmStatuses = useMemo(() => {
    const statuses = alarmLogs?.map(a => a.status).filter(Boolean) || [];
    return [...new Set(statuses)];
  }, [alarmLogs]);

  const uniqueAlarmSitenames = useMemo(() => {
    const sitenames = alarmLogs?.map(a => a.sitename).filter(Boolean) || [];
    return [...new Set(sitenames)];
  }, [alarmLogs]);

  const uniqueAlarmDeviceGroups = useMemo(() => {
    const groups = alarmLogs?.map(a => a.device_group).filter(Boolean) || [];
    return [...new Set(groups)];
  }, [alarmLogs]);

  // Filtered alarm logs
  const filteredAlarmLogs = useMemo(() => {
    return alarmLogs?.filter(alarm => {
      const matchesSearch = globalFilter === '' || 
        alarm.device_name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        alarm.device_id?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        alarm.alarm_type?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        alarm.message?.toLowerCase().includes(globalFilter.toLowerCase());
      
      const matchesDevice = alarmDeviceFilter === 'all' || alarm.device_name === alarmDeviceFilter;
      const matchesType = alarmTypeFilter === 'all' || alarm.alarm_type === alarmTypeFilter;
      const matchesSeverity = alarmSeverityFilter === 'all' || alarm.severity === alarmSeverityFilter;
      const matchesStatus = alarmStatusFilter === 'all' || alarm.status === alarmStatusFilter;
      const matchesSitename = alarmSitenameFilter === 'all' || alarm.sitename === alarmSitenameFilter;
      const matchesDeviceGroup = alarmDeviceGroupFilter === 'all' || alarm.device_group === alarmDeviceGroupFilter;
      
      return matchesSearch && matchesDevice && matchesType && matchesSeverity && matchesStatus && matchesSitename && matchesDeviceGroup;
    }) || [];
  }, [alarmLogs, globalFilter, alarmDeviceFilter, alarmTypeFilter, alarmSeverityFilter, alarmStatusFilter, alarmSitenameFilter, alarmDeviceGroupFilter]);

  // TanStack Table columns for alarm logs
  const alarmLogColumns = useMemo<ColumnDef<AlarmLog, any>[]>(() => [
    {
      accessorKey: 'device_name',
      header: 'Device',
      cell: (info) => info.getValue() || 'N/A',
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
              {alarmType?.replace('_', ' ').toUpperCase() || 'N/A'}
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
            {message || 'N/A'}
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
            {severity?.toUpperCase() || 'N/A'}
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
            {status?.toUpperCase() || 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: (info) => {
        const date = info.getValue() as string;
        return date ? new Date(date).toLocaleString() : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const alarm = row.original as AlarmLog;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Link to={`/alarm-logs/${alarm.id}`}>
              <Button variant="ghost" size="icon">
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        );
      },
    },
  ], []);

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

  const handleClearFilters = () => {
    setGlobalFilter('');
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Alarm Logs</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAlarmLogs}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-muted-foreground">Monitor and manage alarm events from your devices</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAlarmLogs}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Logs
          </Button>
        </div>

        {/* Alarm Logs Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Alarm Log Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Input
                  placeholder="Search alarm logs..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="w-full"
                  size={32}
                />
              </div>

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
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alarm Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alarm Logs ({filteredAlarmLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
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
      </div>
    </AppLayout>
  );
} 