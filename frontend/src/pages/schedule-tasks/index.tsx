import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Plus, Search, Filter, MoreHorizontal, Play, Pause, RotateCcw } from 'lucide-react';
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
import { scheduleTasksService, type ScheduleTask, type ScheduleTaskFilters } from '@/services/schedule-tasks';

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

export default function ScheduleTasksIndex() {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });
  
  const [search, setSearch] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const filters: ScheduleTaskFilters = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        search,
        task_type: taskTypeFilter !== 'all' ? taskTypeFilter : undefined,
        frequency: frequencyFilter !== 'all' ? frequencyFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        is_active: activeFilter !== 'all' ? activeFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const data = await scheduleTasksService.getScheduleTasks(filters);
      setTasks(data.data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total,
        from: data.from,
        to: data.to,
      });
    } catch (error) {
      toast.error('Failed to fetch schedule tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [pagination.current_page, search, taskTypeFilter, frequencyFilter, statusFilter, activeFilter, sortBy, sortOrder]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
  };

  const handleTaskAction = async (taskId: number, action: 'execute' | 'pause' | 'resume') => {
    try {
      let result;
      switch (action) {
        case 'execute':
          result = await scheduleTasksService.executeScheduleTask(taskId);
          break;
        case 'pause':
          result = await scheduleTasksService.pauseScheduleTask(taskId);
          break;
        case 'resume':
          result = await scheduleTasksService.resumeScheduleTask(taskId);
          break;
        default:
          throw new Error('Invalid action');
      }

      toast.success(result.message);
      fetchTasks(); // Refresh the list
    } catch (error) {
      toast.error('An error occurred while performing the action.');
      console.error('Error performing task action:', error);
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
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule Tasks</h1>
          </div>
          <Link to="/schedule-tasks/create">
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
              Schedule Tasks ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
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
                          {sortBy === 'name' && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? '↑' : '↓'}
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
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <Link
                              to={`/schedule-tasks/${task.id}`}
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
                                <Link to={`/schedule-tasks/${task.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/schedule-tasks/${task.id}/edit`}>
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

                {tasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No schedule tasks found.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.from} to {pagination.to} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              {pagination.current_page > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                >
                  Previous
                </Button>
              )}
              {pagination.current_page < pagination.last_page && (
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
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
