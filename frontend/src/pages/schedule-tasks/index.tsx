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

import { Search, Plus, RefreshCw, Clock, Play, Pause, Calendar, Activity } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { scheduleTasksService, type ScheduleTask } from '@/services/schedule-tasks';

interface ScheduleTaskWithBase extends ScheduleTask, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Schedule Tasks', href: '/schedule-tasks' },
];

export default function ScheduleTasksIndex() {
  const { token } = useAuthStore();
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTaskWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');


  // Fetch schedule tasks from API
  const fetchScheduleTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await scheduleTasksService.getScheduleTasks();
      
      // Transform data to include BaseRecord properties
      const transformedData: ScheduleTaskWithBase[] = data.schedule_tasks.map(task => ({
        ...task,
        id: task.id,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));
      
      setScheduleTasks(transformedData);
    } catch (error) {
      console.error('Error fetching schedule tasks:', error);
      toast.error('Failed to fetch schedule tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchScheduleTasks();
  }, [fetchScheduleTasks]);

  // Filtered schedule tasks
  const filteredScheduleTasks = useMemo(() => {
    return scheduleTasks.filter(task => {
      const matchesSearch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.command.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [scheduleTasks, searchTerm, statusFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = scheduleTasks.map(s => s.status).filter(Boolean);
    return [...new Set(statuses)];
  }, [scheduleTasks]);

  // Schedule tasks statistics
  const scheduleTaskStats = useMemo(() => {
    const total = scheduleTasks.length;
    const active = scheduleTasks.filter(s => s.status === 'active').length;
    const paused = scheduleTasks.filter(s => s.status === 'paused').length;
    const completed = scheduleTasks.filter(s => s.status === 'completed').length;
    const failed = scheduleTasks.filter(s => s.status === 'failed').length;
    
    return {
      total,
      active,
      paused,
      completed,
      failed,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [scheduleTasks]);

  // Handle delete
  const handleDelete = useCallback(async (scheduleTask: ScheduleTaskWithBase) => {
    try {
      await scheduleTasksService.deleteScheduleTask(scheduleTask.id);
      toast.success('Schedule task deleted successfully');
      fetchScheduleTasks();
    } catch (error) {
      console.error('Error deleting schedule task:', error);
      toast.error('Failed to delete schedule task');
    }
  }, [fetchScheduleTasks]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }, []);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.getValue('description') || 'No description',
    },
    {
      accessorKey: 'cron_expression',
      header: 'Cron Expression',
      cell: ({ row }) => (
        <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {row.getValue('cron_expression')}
        </div>
      ),
    },
    {
      accessorKey: 'command',
      header: 'Command',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-mono text-sm">
          {row.getValue('command')}
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
            case 'active': return 'default';
            case 'paused': return 'secondary';
            case 'completed': return 'outline';
            case 'failed': return 'destructive';
            default: return 'secondary';
          }
        };
        
        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'active': return <Play className="h-3 w-3" />;
            case 'paused': return <Pause className="h-3 w-3" />;
            case 'completed': return <Calendar className="h-3 w-3" />;
            case 'failed': return <Activity className="h-3 w-3" />;
            default: return <Clock className="h-3 w-3" />;
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
      accessorKey: 'last_run_at',
      header: 'Last Run',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue('last_run_at'))}
        </div>
      ),
    },
    {
      accessorKey: 'next_run_at',
      header: 'Next Run',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue('next_run_at'))}
        </div>
      ),
    },
    createCreatedAtColumn<ScheduleTaskWithBase>(),
    createActionsColumn<ScheduleTaskWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/schedule-tasks/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this schedule task?",
    }),
  ], [handleDelete, formatDate]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Schedule Tasks</h1>
            <p className="text-muted-foreground">Manage automated tasks and scheduling</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchScheduleTasks}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/schedule-tasks/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Schedule Tasks Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleTaskStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All scheduled tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{scheduleTaskStats.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paused Tasks</CardTitle>
              <Pause className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{scheduleTaskStats.paused}</div>
              <p className="text-xs text-muted-foreground">
                Temporarily stopped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{scheduleTaskStats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Tasks</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{scheduleTaskStats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Execution errors
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
                  placeholder="Search tasks..."
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
          data={filteredScheduleTasks}
          title="Schedule Tasks"
          description={`Showing ${filteredScheduleTasks.length} of ${scheduleTasks.length} tasks`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 
