import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Search, Plus, RefreshCw, AlertTriangle, Bell, CheckCircle, XCircle, Activity } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { alarmLogsService, type AlarmLog } from '@/services/alarm-logs';

interface AlarmLogWithBase extends AlarmLog, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Alarm Logs', href: '/alarm-logs' },
];

export default function AlarmLogsIndex() {
  const { token } = useAuthStore();
  const [alarmLogs, setAlarmLogs] = useState<AlarmLogWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');


  // Fetch alarm logs from API
  const fetchAlarmLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alarmLogsService.getAlarmLogs();
      
      // Transform data to include BaseRecord properties
      const transformedData: AlarmLogWithBase[] = data.alarm_logs.map(log => ({
        ...log,
        id: log.id,
        created_at: log.created_at,
        updated_at: log.updated_at,
      }));
      
      setAlarmLogs(transformedData);
    } catch (error) {
      console.error('Error fetching alarm logs:', error);
      toast.error('Failed to fetch alarm logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAlarmLogs();
  }, [fetchAlarmLogs]);

  // Filtered alarm logs
  const filteredAlarmLogs = useMemo(() => {
    return alarmLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.alarm_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
      
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [alarmLogs, searchTerm, statusFilter, severityFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = alarmLogs.map(s => s.status).filter(Boolean);
    return [...new Set(statuses)];
  }, [alarmLogs]);

  const uniqueSeverities = useMemo(() => {
    const severities = alarmLogs.map(s => s.severity).filter(Boolean);
    return [...new Set(severities)];
  }, [alarmLogs]);

  // Alarm logs statistics
  const alarmLogStats = useMemo(() => {
    const total = alarmLogs.length;
    const active = alarmLogs.filter(s => s.status === 'active').length;
    const resolved = alarmLogs.filter(s => s.status === 'resolved').length;
    const critical = alarmLogs.filter(s => s.severity === 'critical').length;
    const warning = alarmLogs.filter(s => s.severity === 'warning').length;
    const info = alarmLogs.filter(s => s.severity === 'info').length;
    
    return {
      total,
      active,
      resolved,
      critical,
      warning,
      info,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [alarmLogs]);

  // Handle delete
  const handleDelete = useCallback(async (alarmLog: AlarmLogWithBase) => {
    try {
      await alarmLogsService.deleteAlarmLog(alarmLog.id);
      toast.success('Alarm log deleted successfully');
      fetchAlarmLogs();
    } catch (error) {
      console.error('Error deleting alarm log:', error);
      toast.error('Failed to delete alarm log');
    }
  }, [fetchAlarmLogs]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setSeverityFilter('all');
  }, []);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'device_id',
      header: 'Device ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{row.getValue('device_id')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'device_name',
      header: 'Device Name',
      cell: ({ row }) => row.getValue('device_name') || 'N/A',
    },
    {
      accessorKey: 'alarm_type',
      header: 'Alarm Type',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('alarm_type')}</div>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.getValue('severity') as string;
        const getSeverityVariant = (severity: string) => {
          switch (severity) {
            case 'critical': return 'destructive';
            case 'warning': return 'default';
            case 'info': return 'secondary';
            default: return 'outline';
          }
        };
        
        const getSeverityIcon = (severity: string) => {
          switch (severity) {
            case 'critical': return <AlertTriangle className="h-3 w-3" />;
            case 'warning': return <AlertTriangle className="h-3 w-3" />;
            case 'info': return <Activity className="h-3 w-3" />;
            default: return <Bell className="h-3 w-3" />;
          }
        };
        
        return (
          <Badge variant={getSeverityVariant(severity)}>
            {getSeverityIcon(severity)}
            <span className="ml-1">{severity.toUpperCase()}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-sm">
          {row.getValue('message')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const getStatusVariant = (status: string) => {
          switch (status) {
            case 'active': return 'destructive';
            case 'resolved': return 'default';
            default: return 'secondary';
          }
        };
        
        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'active': return <AlertTriangle className="h-3 w-3" />;
            case 'resolved': return <CheckCircle className="h-3 w-3" />;
            default: return <Activity className="h-3 w-3" />;
          }
        };
        
        return (
          <Badge variant={getStatusVariant(status)}>
            {getStatusIcon(status)}
            <span className="ml-1">{status.toUpperCase()}</span>
          </Badge>
        );
      },
    },
    createCreatedAtColumn<AlarmLogWithBase>(),
    createActionsColumn<AlarmLogWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/alarm-logs/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this alarm log?",
    }),
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Alarm Logs</h1>
            <p className="text-muted-foreground">Monitor device alarms and system alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAlarmLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/alarm-logs/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Alarm
              </Button>
            </Link>
          </div>
        </div>

        {/* Alarm Logs Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alarms</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alarmLogStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All alarm logs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alarmLogStats.active}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[60px]">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${alarmLogStats.activePercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{alarmLogStats.activePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{alarmLogStats.resolved}</div>
              <p className="text-xs text-muted-foreground">
                Resolved alarms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alarmLogStats.critical}</div>
              <p className="text-xs text-muted-foreground">
                Critical severity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{alarmLogStats.warning}</div>
              <p className="text-xs text-muted-foreground">
                Warning severity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Info</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{alarmLogStats.info}</div>
              <p className="text-xs text-muted-foreground">
                Info severity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative min-w-[200px]">
                <Input
                  placeholder="Search alarm logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 min-w-[120px] px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-8 min-w-[120px] px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Severity</option>
                {uniqueSeverities.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity.toUpperCase()}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredAlarmLogs}
          title="Alarm Logs"
          description={`Showing ${filteredAlarmLogs.length} of ${alarmLogs.length} alarm logs`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 