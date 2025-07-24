import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Filter, MoreHorizontal, Play, Pause, RotateCcw, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';

interface ScheduleTask {
  id: number;
  name: string;
  description: string | null;
  device_group_id: number;
  task_type: 'ussd' | 'sms';
  command: string;
  recipient: string | null;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cron_expression: string | null;
  time: string;
  day_of_week: number | null;
  day_of_month: number | null;
  month: number | null;
  interval_minutes: number | null;
  is_active: boolean;
  dual_sim_support: boolean;
  fallback_to_single_sim: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  last_executed_at: string | null;
  next_execution_at: string | null;
  execution_count: number;
  success_count: number;
  failure_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  status_badge_variant: string;
  task_type_badge_variant: string;
  frequency_badge_variant: string;
  human_readable_frequency: string;
  success_rate: number;
  can_execute: boolean;
  can_pause: boolean;
  can_resume: boolean;
  device_group_data: {
    id: number;
    name: string;
  } | null;
}

interface Props {
  tasks: {
    data: ScheduleTask[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: {
    search: string;
    task_type: string;
    frequency: string;
    status: string;
    is_active: string;
    sort_by: string;
    sort_order: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Schedule Tasks',
    href: '/schedule-tasks',
  },
];

export default function ScheduleTasksIndex({ tasks, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [taskTypeFilter, setTaskTypeFilter] = useState(filters.task_type || 'all');
  const [frequencyFilter, setFrequencyFilter] = useState(filters.frequency || 'all');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [activeFilter, setActiveFilter] = useState(filters.is_active || 'all');

  const handleSearch = () => {
    router.get(route('schedule-tasks.index'), {
      search,
      task_type: taskTypeFilter,
      frequency: frequencyFilter,
      status: statusFilter,
      is_active: activeFilter,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleSort = (column: string) => {
    const newOrder = filters.sort_by === column && filters.sort_order === 'asc' ? 'desc' : 'asc';
    router.get(route('schedule-tasks.index'), {
      search,
      task_type: taskTypeFilter,
      frequency: frequencyFilter,
      status: statusFilter,
      is_active: activeFilter,
      sort_by: column,
      sort_order: newOrder,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleTaskAction = async (taskId: number, action: 'execute' | 'pause' | 'resume') => {
    try {
      const response = await fetch(route(`schedule-tasks.${action}`, taskId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred while performing the action.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: 'default',
      paused: 'secondary',
      completed: 'outline',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTaskTypeBadge = (taskType: string) => {
    const variants: Record<string, "default" | "outline" | "secondary"> = {
      ussd: 'default',
      sms: 'outline',
    };

    return (
      <Badge variant={variants[taskType] || 'secondary'}>
        {taskType.toUpperCase()}
      </Badge>
    );
  };

  const getFrequencyBadge = (frequency: string) => {
    const variants: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
      hourly: 'default',
      daily: 'outline',
      weekly: 'secondary',
      monthly: 'outline',
      custom: 'destructive',
    };

    return (
      <Badge variant={variants[frequency] || 'secondary'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Schedule Tasks" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule Tasks</h1>
          </div>
          <Link href={route('schedule-tasks.create')}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Schedule Task
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search by name, description, or command..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Task Type</label>
                <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ussd">USSD</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frequencies</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Active Status</label>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Schedule Tasks ({tasks.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-medium"
                    >
                      Name
                      {filters.sort_by === 'name' && (
                        <span className="ml-1">
                          {filters.sort_order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Device Group</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Execution</TableHead>
                  <TableHead>Next Execution</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.data.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <Link
                          href={route('schedule-tasks.show', task.id)}
                          className="font-medium hover:underline"
                        >
                          {task.name}
                        </Link>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {task.device_group_data?.name || 'Unknown Group'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTaskTypeBadge(task.task_type)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getFrequencyBadge(task.frequency)}
                        <div className="text-xs text-muted-foreground">
                          {task.human_readable_frequency}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(task.last_executed_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(task.next_execution_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{task.success_rate}%</div>
                        <div className="text-xs text-muted-foreground">
                          ({task.success_count}/{task.execution_count})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={route('schedule-tasks.show', task.id)}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={route('schedule-tasks.edit', task.id)}>
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {task.can_execute && (
                            <DropdownMenuItem
                              onClick={() => handleTaskAction(task.id, 'execute')}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Execute Now
                            </DropdownMenuItem>
                          )}
                          {task.can_pause && (
                            <DropdownMenuItem
                              onClick={() => handleTaskAction(task.id, 'pause')}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {task.can_resume && (
                            <DropdownMenuItem
                              onClick={() => handleTaskAction(task.id, 'resume')}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {tasks.data.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No schedule tasks found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {tasks.last_page > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {tasks.from} to {tasks.to} of {tasks.total} results
            </div>
            <div className="flex space-x-2">
              {tasks.current_page > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', String(tasks.current_page - 1));
                    router.visit(url.toString());
                  }}
                >
                  Previous
                </Button>
              )}
              {tasks.current_page < tasks.last_page && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', String(tasks.current_page + 1));
                    router.visit(url.toString());
                  }}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 