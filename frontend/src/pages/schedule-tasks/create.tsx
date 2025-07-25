import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { scheduleTasksService, type CreateScheduleTaskData } from '@/services/schedule-tasks';

interface DeviceGroup {
  id: number;
  name: string;
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

export default function ScheduleTaskCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  
  const [formData, setFormData] = useState<CreateScheduleTaskData>({
    name: '',
    description: '',
    device_group_id: 0,
    task_type: 'ussd',
    command: '',
    recipient: '',
    frequency: 'hourly',
    cron_expression: '',
    time: '00:00',
    day_of_week: undefined,
    day_of_month: undefined,
    month: undefined,
    interval_minutes: undefined,
    is_active: true,
    dual_sim_support: false,
    fallback_to_single_sim: true,
    max_retries: 3,
    retry_delay_minutes: 5,
  });

  useEffect(() => {
    fetchDeviceGroups();
  }, []);

  const fetchDeviceGroups = async () => {
    try {
      const response = await fetch('/api/device-groups');
      if (response.ok) {
        const data = await response.json();
        setDeviceGroups(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching device groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.device_group_id || !formData.command) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await scheduleTasksService.createScheduleTask(formData);
      toast.success('Schedule task created successfully');
      navigate('/schedule-tasks');
    } catch (error) {
      toast.error('Failed to create schedule task');
      console.error('Error creating schedule task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    setFormData(prev => ({
      ...prev,
      frequency: frequency as any,
      day_of_week: undefined,
      day_of_month: undefined,
      month: undefined,
      interval_minutes: undefined,
      cron_expression: '',
    }));
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
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/schedule-tasks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Schedule Task</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter task name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device_group">Device Group *</Label>
                  <Select
                    value={formData.device_group_id.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, device_group_id: parseInt(value) }))}
                  >
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task_type">Task Type *</Label>
                  <Select
                    value={formData.task_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value as 'ussd' | 'sms' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ussd">USSD</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="command">Command *</Label>
                  <Textarea
                    id="command"
                    value={formData.command}
                    onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                    placeholder="Enter USSD code or SMS message"
                    rows={3}
                    required
                  />
                </div>

                {formData.task_type === 'sms' && (
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Number</Label>
                    <Input
                      id="recipient"
                      value={formData.recipient || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="Enter recipient phone number"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={handleFrequencyChange}
                  >
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
                </div>

                {formData.frequency === 'daily' && (
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                )}

                {formData.frequency === 'weekly' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="day_of_week">Day of Week</Label>
                      <Select
                        value={formData.day_of_week?.toString() || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDayOfWeekOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {formData.frequency === 'monthly' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="day_of_month">Day of Month</Label>
                      <Input
                        id="day_of_month"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.day_of_month || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, day_of_month: parseInt(e.target.value) }))}
                        placeholder="1-31"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {formData.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="interval_minutes">Interval (minutes)</Label>
                    <Input
                      id="interval_minutes"
                      type="number"
                      min="1"
                      value={formData.interval_minutes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_minutes: parseInt(e.target.value) }))}
                      placeholder="Enter interval in minutes"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="max_retries">Max Retries</Label>
                  <Input
                    id="max_retries"
                    type="number"
                    min="0"
                    value={formData.max_retries}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry_delay_minutes">Retry Delay (minutes)</Label>
                  <Input
                    id="retry_delay_minutes"
                    type="number"
                    min="1"
                    value={formData.retry_delay_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, retry_delay_minutes: parseInt(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dual_sim_support"
                    checked={formData.dual_sim_support}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dual_sim_support: checked as boolean }))}
                  />
                  <Label htmlFor="dual_sim_support">Dual SIM Support</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fallback_to_single_sim"
                    checked={formData.fallback_to_single_sim}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fallback_to_single_sim: checked as boolean }))}
                  />
                  <Label htmlFor="fallback_to_single_sim">Fallback to Single SIM</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Link to="/schedule-tasks">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
} 
