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

import { Search, Plus, RefreshCw, Smartphone, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { ussdLogsService, type UssdLog } from '@/services/ussd-logs';

interface UssdLogWithBase extends UssdLog, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'USSD Logs', href: '/ussd-logs' },
];

export default function UssdLogsIndex() {
  const { token } = useAuthStore();
  const [ussdLogs, setUssdLogs] = useState<UssdLogWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');


  // Fetch USSD logs from API
  const fetchUssdLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ussdLogsService.getUssdLogs();
      
      // Transform data to include BaseRecord properties
      const transformedData: UssdLogWithBase[] = data.data.map(log => ({
        ...log,
        id: log.id,
        created_at: log.created_at,
        updated_at: log.updated_at,
      }));
      
      setUssdLogs(transformedData);
    } catch (error) {
      console.error('Error fetching USSD logs:', error);
      toast.error('Failed to fetch USSD logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUssdLogs();
  }, [fetchUssdLogs]);

  // Filtered USSD logs
  const filteredUssdLogs = useMemo(() => {
    return ussdLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ussd_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.response_message?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ussdLogs, searchTerm, statusFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = ussdLogs.map(s => s.status).filter(Boolean);
    return [...new Set(statuses)];
  }, [ussdLogs]);

  // USSD logs statistics
  const ussdLogStats = useMemo(() => {
    const total = ussdLogs.length;
    const success = ussdLogs.filter(s => s.status === 'success').length;
    const failed = ussdLogs.filter(s => s.status === 'failed').length;
    const pending = ussdLogs.filter(s => s.status === 'pending').length;
    // Calculate duration from sent_at and received_at if available
    const totalDuration = ussdLogs.reduce((sum, s) => {
      if (s.sent_at && s.received_at) {
        const sent = new Date(s.sent_at).getTime();
        const received = new Date(s.received_at).getTime();
        return sum + (received - sent);
      }
      return sum;
    }, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
    
    return {
      total,
      success,
      failed,
      pending,
      avgDuration,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0
    };
  }, [ussdLogs]);

  // Handle delete
  const handleDelete = useCallback(async (ussdLog: UssdLogWithBase) => {
    try {
      await ussdLogsService.deleteUssdLog(ussdLog.id);
      toast.success('USSD log deleted successfully');
      fetchUssdLogs();
    } catch (error) {
      console.error('Error deleting USSD log:', error);
      toast.error('Failed to delete USSD log');
    }
  }, [fetchUssdLogs]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  // Format duration helper
  const formatDuration = useCallback((durationMs: number) => {
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  }, []);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'device_id',
      header: 'Device ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
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
      accessorKey: 'ussd_code',
      header: 'USSD Code',
      cell: ({ row }) => (
        <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {row.getValue('ussd_code')}
        </div>
      ),
    },
    {
      accessorKey: 'response_message',
      header: 'Response',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm">
          {row.getValue('response_message') || 'N/A'}
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
            case 'success': return 'default';
            case 'failed': return 'destructive';
            case 'pending': return 'secondary';
            default: return 'secondary';
          }
        };
        
        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'success': return <CheckCircle className="h-3 w-3" />;
            case 'failed': return <XCircle className="h-3 w-3" />;
            case 'pending': return <Clock className="h-3 w-3" />;
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
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => {
        const log = row.original;
        let duration = 0;
        if (log.sent_at && log.received_at) {
          const sent = new Date(log.sent_at).getTime();
          const received = new Date(log.received_at).getTime();
          duration = received - sent;
        }
        
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDuration(duration)}</span>
          </div>
        );
      },
    },
    createCreatedAtColumn<UssdLogWithBase>(),
    createActionsColumn<UssdLogWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/ussd-logs/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this USSD log?",
    }),
  ], [handleDelete, formatDuration]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">USSD Logs</h1>
            <p className="text-muted-foreground">Monitor USSD session logs and responses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUssdLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/ussd-logs/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add USSD Log
              </Button>
            </Link>
          </div>
        </div>

        {/* USSD Logs Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ussdLogStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All USSD session logs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{ussdLogStats.success}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[60px]">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${ussdLogStats.successRate}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{ussdLogStats.successRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{ussdLogStats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Failed USSD sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{ussdLogStats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Pending sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatDuration(ussdLogStats.avgDuration)}</div>
              <p className="text-xs text-muted-foreground">
                Average session time
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
                  placeholder="Search USSD logs..."
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
          data={filteredUssdLogs}
          title="USSD Logs"
          description={`Showing ${filteredUssdLogs.length} of ${ussdLogs.length} USSD logs`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 
