import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Play, Pause, RotateCcw, Trash2, Clock, Activity, Server, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
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
  last_execution_result: any;
}

interface Props {
  task: ScheduleTask;
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
  {
    title: 'Details',
    href: '/schedule-tasks/show',
  },
];

export default function ScheduleTaskShow({ task }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTaskAction = async (action: 'execute' | 'pause' | 'resume') => {
    try {
      const response = await fetch(route(`schedule-tasks.${action}`, task.id), {
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

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(route('schedule-tasks.destroy', task.id), {
      onSuccess: () => {
        toast.success('Schedule task deleted successfully.');
      },
      onError: () => {
        setIsDeleting(false);
        toast.error('Failed to delete schedule task.');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
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
    const variants: Record<string, string> = {
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
    const variants: Record<string, string> = {
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
      <Head title={`Schedule Task - ${task.name}`} />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Link href={route('schedule-tasks.edit', task.id)}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Status and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              Status & Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Status</div>
                <div>{getStatusBadge(task.status)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Success Rate</div>
                <div className="text-sm">{task.success_rate}%</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Total Executions</div>
                <div className="text-sm">{task.execution_count}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Active</div>
                <div>
                  <Badge variant={task.is_active ? 'default' : 'secondary'}>
                    {task.is_active ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex space-x-2">
              {task.can_execute && (
                <Button onClick={() => handleTaskAction('execute')}>
                  <Play className="mr-2 h-4 w-4" />
                  Execute Now
                </Button>
              )}
              {task.can_pause && (
                <Button variant="outline" onClick={() => handleTaskAction('pause')}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              {task.can_resume && (
                <Button variant="outline" onClick={() => handleTaskAction('resume')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Schedule Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{task.name}"? This action cannot be undone.
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

            {task.last_error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="text-sm font-medium text-destructive">Last Error</div>
                <div className="text-sm text-destructive/80">{task.last_error}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Name</div>
                <div className="text-sm">{task.name}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Device Group</div>
                <div className="text-sm">{task.device_group_data?.name || 'Unknown Group'}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Description</div>
                <div className="text-sm">{task.description || 'No description'}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Task Type</div>
                <div>{getTaskTypeBadge(task.task_type)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Task Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Command/Message</div>
                <div className="text-sm bg-muted p-2 rounded">{task.command}</div>
              </div>

              {task.recipient && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recipient</div>
                  <div className="text-sm">{task.recipient}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Frequency</div>
                <div className="space-y-1">
                  {getFrequencyBadge(task.frequency)}
                  <div className="text-xs text-muted-foreground">
                    {task.human_readable_frequency}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Time</div>
                <div className="text-sm">{task.time}</div>
              </div>
            </div>

            {task.frequency === 'weekly' && task.day_of_week !== null && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Day of Week</div>
                <div className="text-sm">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][task.day_of_week]}
                </div>
              </div>
            )}

            {task.frequency === 'monthly' && task.day_of_month !== null && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Day of Month</div>
                <div className="text-sm">{task.day_of_month}</div>
              </div>
            )}

            {task.frequency === 'custom' && (
              <div className="mt-4 space-y-2">
                {task.cron_expression && (
                  <div>
                    <div className="text-sm font-medium">Cron Expression</div>
                    <div className="text-sm bg-muted p-2 rounded">{task.cron_expression}</div>
                  </div>
                )}
                {task.interval_minutes && (
                  <div>
                    <div className="text-sm font-medium">Interval</div>
                    <div className="text-sm">Every {task.interval_minutes} minutes</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Max Retries</div>
                <div className="text-sm">{task.max_retries}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Retry Delay</div>
                <div className="text-sm">{task.retry_delay_minutes} minutes</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Dual SIM Support</div>
                <div>
                  <Badge variant={task.dual_sim_support ? 'default' : 'secondary'}>
                    {task.dual_sim_support ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Fallback to Single SIM</div>
                <div>
                  <Badge variant={task.fallback_to_single_sim ? 'default' : 'secondary'}>
                    {task.fallback_to_single_sim ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              Execution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Last Executed</div>
                <div className="text-sm">{formatDateTime(task.last_executed_at)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Next Execution</div>
                <div className="text-sm">{formatDateTime(task.next_execution_at)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Successful Executions</div>
                <div className="text-sm">{task.success_count}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Failed Executions</div>
                <div className="text-sm">{task.failure_count}</div>
              </div>
            </div>

            {task.last_execution_result && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Last Execution Result</div>
                <div className="text-sm bg-muted p-3 rounded">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(task.last_execution_result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
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
                <div className="text-sm">{formatDateTime(task.created_at)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Updated At</div>
                <div className="text-sm">{formatDateTime(task.updated_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 