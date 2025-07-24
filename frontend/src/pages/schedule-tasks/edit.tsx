import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';

interface DeviceGroup {
  id: number;
  name: string;
}

interface OperatorCommand {
  id: number;
  name: string;
  command_type: 'ussd' | 'sms';
  key: string;
  code: string;
  message_text: string | null;
  number: string | null;
  mcc_mnc: {
    id: number;
    mcc: string;
    mnc: string;
    country_name: string;
    brand: string;
    operator: string;
  };
}

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
}

interface Props {
  task: ScheduleTask;
  deviceGroups: DeviceGroup[];
  operatorCommands: {
    ussd: OperatorCommand[];
    sms: OperatorCommand[];
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
  {
    title: 'Edit',
    href: '/schedule-tasks/edit',
  },
];

export default function ScheduleTaskEdit({ task, deviceGroups, operatorCommands }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: task.name,
    description: task.description || '',
    device_group_id: task.device_group_id,
    task_type: task.task_type,
    command: task.command,
    recipient: task.recipient || '',
    operator_command_id: '',
    command_key: '',
    frequency: task.frequency,
    cron_expression: task.cron_expression || '',
    time: task.time,
    day_of_week: task.day_of_week || '',
    day_of_month: task.day_of_month || '',
    month: task.month || '',
    interval_minutes: task.interval_minutes || '',
    is_active: task.is_active,
    dual_sim_support: task.dual_sim_support,
    fallback_to_single_sim: task.fallback_to_single_sim,
    max_retries: task.max_retries,
    retry_delay_minutes: task.retry_delay_minutes,
  });

  const [showCustomFields, setShowCustomFields] = useState(task.frequency === 'custom');
  const [showWeeklyFields, setShowWeeklyFields] = useState(task.frequency === 'weekly');
  const [showMonthlyFields, setShowMonthlyFields] = useState(task.frequency === 'monthly');

  useEffect(() => {
    setShowCustomFields(data.frequency === 'custom');
    setShowWeeklyFields(data.frequency === 'weekly');
    setShowMonthlyFields(data.frequency === 'monthly');
  }, [data.frequency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('schedule-tasks.update', task.id), {
      onSuccess: () => {
        toast.success('Schedule task updated successfully.');
      },
      onError: () => {
        toast.error('Failed to update schedule task.');
      },
    });
  };

  const handleFrequencyChange = (value: string) => {
    setData('frequency', value as any);
    setData('cron_expression', '');
    setData('interval_minutes', '');
    setData('day_of_week', '');
    setData('day_of_month', '');
    setData('month', '');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Schedule Task - ${task.name}`} />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Schedule Task</h1>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter task name"
                  />
                  <InputError message={errors.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device_group_id">Device Group</Label>
                  <Select value={data.device_group_id.toString()} onValueChange={(value) => setData('device_group_id', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device group" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputError message={errors.device_group_id} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                />
                <InputError message={errors.description} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select value={data.task_type} onValueChange={(value) => setData('task_type', value as 'ussd' | 'sms')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ussd">USSD</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.task_type} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="command_key">Command Key</Label>
                  <Select 
                    value={data.command_key || ''} 
                    onValueChange={(value) => setData('command_key', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select command key" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main_balance_check">Main Balance Check</SelectItem>
                      <SelectItem value="sms_balance_check">SMS Balance Check</SelectItem>
                      <SelectItem value="buy_pack_command">Buy Pack Command</SelectItem>
                      <SelectItem value="phonenumber_check">Phone Number Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.command_key} />
                </div>
              </div>

              {data.task_type === 'sms' && (
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient (Optional)</Label>
                  <Input
                    id="recipient"
                    value={data.recipient}
                    onChange={(e) => setData('recipient', e.target.value)}
                    placeholder="Enter recipient phone number"
                  />
                  <InputError message={errors.recipient} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={data.frequency} onValueChange={handleFrequencyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.frequency} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={data.time}
                    onChange={(e) => setData('time', e.target.value)}
                  />
                  <InputError message={errors.time} />
                </div>
              </div>

              {showWeeklyFields && (
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week</Label>
                  <Select value={data.day_of_week.toString()} onValueChange={(value) => setData('day_of_week', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day of week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.day_of_week} />
                </div>
              )}

              {showMonthlyFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day_of_month">Day of Month</Label>
                    <Input
                      id="day_of_month"
                      type="number"
                      min="1"
                      max="31"
                      value={data.day_of_month}
                      onChange={(e) => setData('day_of_month', parseInt(e.target.value) || 0)}
                      placeholder="1-31"
                    />
                    <InputError message={errors.day_of_month} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select value={data.month.toString()} onValueChange={(value) => setData('month', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="2">February</SelectItem>
                        <SelectItem value="3">March</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="8">August</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.month} />
                  </div>
                </div>
              )}

              {showCustomFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cron_expression">Cron Expression</Label>
                    <Input
                      id="cron_expression"
                      value={data.cron_expression}
                      onChange={(e) => setData('cron_expression', e.target.value)}
                      placeholder="* * * * *"
                    />
                    <InputError message={errors.cron_expression} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval_minutes">Interval (minutes)</Label>
                    <Input
                      id="interval_minutes"
                      type="number"
                      min="1"
                      value={data.interval_minutes}
                      onChange={(e) => setData('interval_minutes', parseInt(e.target.value) || 0)}
                      placeholder="Enter interval in minutes"
                    />
                    <InputError message={errors.interval_minutes} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_retries">Max Retries</Label>
                  <Input
                    id="max_retries"
                    type="number"
                    min="0"
                    value={data.max_retries}
                    onChange={(e) => setData('max_retries', parseInt(e.target.value) || 0)}
                    placeholder="Enter max retries"
                  />
                  <InputError message={errors.max_retries} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry_delay_minutes">Retry Delay (minutes)</Label>
                  <Input
                    id="retry_delay_minutes"
                    type="number"
                    min="1"
                    value={data.retry_delay_minutes}
                    onChange={(e) => setData('retry_delay_minutes', parseInt(e.target.value) || 0)}
                    placeholder="Enter retry delay"
                  />
                  <InputError message={errors.retry_delay_minutes} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <InputError message={errors.is_active} />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dual_sim_support"
                    checked={data.dual_sim_support}
                    onCheckedChange={(checked) => setData('dual_sim_support', checked as boolean)}
                  />
                  <Label htmlFor="dual_sim_support">Dual SIM Support</Label>
                </div>
                <InputError message={errors.dual_sim_support} />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fallback_to_single_sim"
                    checked={data.fallback_to_single_sim}
                    onCheckedChange={(checked) => setData('fallback_to_single_sim', checked as boolean)}
                  />
                  <Label htmlFor="fallback_to_single_sim">Fallback to Single SIM</Label>
                </div>
                <InputError message={errors.fallback_to_single_sim} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              <Save className="mr-2 h-4 w-4" />
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
} 