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

interface Props {
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
    title: 'Create',
    href: '/schedule-tasks/create',
  },
];

export default function ScheduleTaskCreate({ deviceGroups, operatorCommands }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    device_group_id: '',
    task_type: 'ussd',
    command: '',
    recipient: '',
    operator_command_id: '',
    command_key: '',
    frequency: 'hourly',
    cron_expression: '',
    time: '00:00',
    day_of_week: null as number | null,
    day_of_month: null as number | null,
    month: null as number | null,
    interval_minutes: null as number | null,
    is_active: true,
    dual_sim_support: false,
    fallback_to_single_sim: true,
    max_retries: 3,
    retry_delay_minutes: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('schedule-tasks.store'));
  };

  const handleFrequencyChange = (frequency: string) => {
    setData('frequency', frequency as any);
    
    // Reset frequency-specific fields
    setData('day_of_week', null);
    setData('day_of_month', null);
    setData('month', null);
    setData('interval_minutes', null);
    setData('cron_expression', '');
  };

  const getDayOfWeekOptions = () => [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const getMonthOptions = () => [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Schedule Task" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Schedule Task</h1>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                  <Select value={data.device_group_id} onValueChange={(value) => setData('device_group_id', value)}>
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
                  placeholder="Enter description"
                  rows={3}
                />
                <InputError message={errors.description} />
              </div>
            </CardContent>
          </Card>

          {/* Task Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select value={data.task_type} onValueChange={(value) => setData('task_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ussd">USSD Command</SelectItem>
                      <SelectItem value="sms">SMS Message</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={errors.task_type} />
                </div>

                {data.task_type === 'sms' && (
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Number</Label>
                    <Input
                      id="recipient"
                      value={data.recipient}
                      onChange={(e) => setData('recipient', e.target.value)}
                      placeholder="Enter recipient phone number"
                    />
                    <InputError message={errors.recipient} />
                  </div>
                )}
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
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
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
                      <SelectValue />
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

              {/* Frequency-specific fields */}
              {data.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week</Label>
                  <Select value={data.day_of_week?.toString() || ''} onValueChange={(value) => setData('day_of_week', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day of week" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDayOfWeekOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputError message={errors.day_of_week} />
                </div>
              )}

              {data.frequency === 'monthly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day_of_month">Day of Month</Label>
                    <Input
                      id="day_of_month"
                      type="number"
                      value={data.day_of_month || ''}
                      onChange={(e) => setData('day_of_month', parseInt(e.target.value) || null)}
                      placeholder="1-31"
                      min="1"
                      max="31"
                    />
                    <InputError message={errors.day_of_month} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select value={data.month?.toString() || ''} onValueChange={(value) => setData('month', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonthOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.month} />
                  </div>
                </div>
              )}

              {data.frequency === 'custom' && (
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
                      value={data.interval_minutes || ''}
                      onChange={(e) => setData('interval_minutes', parseInt(e.target.value) || null)}
                      placeholder="e.g., 30"
                      min="1"
                      max="1440"
                    />
                    <InputError message={errors.interval_minutes} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Settings */}
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
                    value={data.max_retries}
                    onChange={(e) => setData('max_retries', parseInt(e.target.value))}
                    placeholder="3"
                    min="1"
                    max="10"
                  />
                  <InputError message={errors.max_retries} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry_delay_minutes">Retry Delay (minutes)</Label>
                  <Input
                    id="retry_delay_minutes"
                    type="number"
                    value={data.retry_delay_minutes}
                    onChange={(e) => setData('retry_delay_minutes', parseInt(e.target.value))}
                    placeholder="5"
                    min="1"
                    max="60"
                  />
                  <InputError message={errors.retry_delay_minutes} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>SIM Card Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dual_sim_support"
                        checked={data.dual_sim_support}
                        onCheckedChange={(checked) => setData('dual_sim_support', checked as boolean)}
                      />
                      <Label htmlFor="dual_sim_support">Use Dual SIM if available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fallback_to_single_sim"
                        checked={data.fallback_to_single_sim}
                        onCheckedChange={(checked) => setData('fallback_to_single_sim', checked as boolean)}
                      />
                      <Label htmlFor="fallback_to_single_sim">Fallback to first SIM</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={data.is_active}
                      onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              <Save className="mr-2 h-4 w-4" />
              {processing ? 'Creating...' : 'Create Schedule Task'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
} 