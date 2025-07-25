import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { ArrowLeft, Edit, Trash2, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { scheduleTasksService, type ScheduleTask } from '@/services/schedule-tasks';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Schedule Tasks',
    href: '/schedule-tasks',
  },
  {
    title: 'Details',
    href: '/schedule-tasks/:id',
  },
];

export default function ScheduleTaskShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<ScheduleTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const taskData = await scheduleTasksService.getScheduleTask(parseInt(id!));
      setTask(taskData);
    } catch (error) {
      toast.error('Failed to fetch schedule task');
      console.error('Error fetching task:', error);
      navigate('/schedule-tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm('Are you sure you want to delete this schedule task?')) {
      return;
    }

    try {
      await scheduleTasksService.deleteScheduleTask(task.id);
      toast.success('Schedule task deleted successfully');
      navigate('/schedule-tasks');
    } catch (error) {
      toast.error('Failed to delete schedule task');
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskAction = async (action: 'execute' | 'pause' | 'resume') => {
    if (!task) return;

    try {
      let result;
      switch (action) {
        case 'execute':
          result = await scheduleTasksService.executeScheduleTask(task.id);
          break;
        case 'pause':
          result = await scheduleTasksService.pauseScheduleTask(task.id);
          break;
        case 'resume':
          result = await scheduleTasksService.resumeScheduleTask(task.id);
          break;
        default:
          throw new Error('Invalid action');
      }

      toast.success(result.message);
      fetchTask(); // Refresh the task data
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

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Schedule task not found.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/schedule-tasks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {task.can_execute && (
              <Button onClick={() => handleTaskAction('execute')} size="sm">
                <Play className="mr-2 h-4 w-4" />
                Execute Now
              </Button>
            )}
            {task.can_pause && (
              <Button onClick={() => handleTaskAction('pause')} variant="outline" size="sm">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {task.can_resume && (
              <Button onClick={() => handleTaskAction('resume')} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            <Link to={`/schedule-tasks/${task.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button onClick={handleDelete} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(task.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Task Type</span>
                {getTaskTypeBadge(task.task_type)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Frequency</span>
                {getFrequencyBadge(task.frequency)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Device Group</span>
                <span className="text-sm">{task.device_group_data?.name || 'Unknown Group'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active</span>
                <span className="text-sm">{task.is_active ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Execution Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Executions</span>
                <span className="text-sm">{task.execution_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Successful</span>
                <span className="text-sm">{task.success_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Failed</span>
                <span className="text-sm">{task.failure_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm">{task.success_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Execution</span>
                <span className="text-sm">{formatDateTime(task.last_executed_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Next Execution</span>
                <span className="text-sm">{formatDateTime(task.next_execution_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Task Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium">Command</span>
                <p className="text-sm mt-1 p-2 bg-muted rounded">{task.command}</p>
              </div>
              {task.recipient && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recipient</span>
                  <span className="text-sm">{task.recipient}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Max Retries</span>
                <span className="text-sm">{task.max_retries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Retry Delay</span>
                <span className="text-sm">{task.retry_delay_minutes} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Dual SIM Support</span>
                <span className="text-sm">{task.dual_sim_support ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Fallback to Single SIM</span>
                <span className="text-sm">{task.fallback_to_single_sim ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Details */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Human Readable</span>
                <span className="text-sm">{task.human_readable_frequency}</span>
              </div>
              {task.frequency === 'daily' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Time</span>
                  <span className="text-sm">{task.time}</span>
                </div>
              )}
              {task.frequency === 'weekly' && task.day_of_week !== null && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Day of Week</span>
                    <span className="text-sm">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][task.day_of_week]}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time</span>
                    <span className="text-sm">{task.time}</span>
                  </div>
                </>
              )}
              {task.frequency === 'monthly' && task.day_of_month !== null && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Day of Month</span>
                    <span className="text-sm">{task.day_of_month}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time</span>
                    <span className="text-sm">{task.time}</span>
                  </div>
                </>
              )}
              {task.frequency === 'custom' && task.interval_minutes !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Interval</span>
                  <span className="text-sm">{task.interval_minutes} minutes</span>
                </div>
              )}
              {task.cron_expression && (
                <div>
                  <span className="text-sm font-medium">Cron Expression</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{task.cron_expression}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Information */}
        {task.last_error && (
          <Card>
            <CardHeader>
              <CardTitle>Last Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive p-2 bg-destructive/10 rounded">{task.last_error}</p>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm">{formatDateTime(task.created_at)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm">{formatDateTime(task.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 
