import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { deviceGroupService, type DeviceGroup } from '@/services/device-groups';
import { 
    Building2, 
    Settings, 
    Shield, 
    Smartphone, 
    MessageSquare, 
    AlertTriangle, 
    Save, 
    ArrowLeft, 
    ArrowRight,
    CheckCircle,
    Circle,
    Clock,
    CreditCard,
    Wifi,
    Battery,
    Signal,
    Bell,
    Zap,
    Gauge,
    Hash,
    Calendar,
    Timer,
    Lock,
    Unlock
} from 'lucide-react';

interface Props {
    deviceGroup?: DeviceGroup | null;
    countrySites: Array<{ id: number; country_site: string }>;
    onSuccess: () => void;
    onCancel: () => void;
}

const steps = [
    { id: 1, title: 'Basic Information', icon: Building2 },
    { id: 2, title: 'Device Settings', icon: Settings },
    { id: 3, title: 'Alarm Settings', icon: AlertTriangle },
    { id: 4, title: 'SMS Limits', icon: MessageSquare },
    { id: 5, title: 'Review & Create', icon: CheckCircle }
];

export default function DeviceGroupForm({ deviceGroup, countrySites, onSuccess, onCancel }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        device_group: deviceGroup?.device_group || '',
        country_site: deviceGroup?.country_site || '',
        country_site_id: deviceGroup?.country_site_id || 0,
        device_type: deviceGroup?.device_type || 'android',
        status: deviceGroup?.status || 'active',
        websocket_url: deviceGroup?.websocket_url || '',
        api_key: deviceGroup?.api_key || '',
        queue_name: deviceGroup?.queue_name || '',
        battery_low_threshold: deviceGroup?.battery_low_threshold || 20,
        error_count_threshold: deviceGroup?.error_count_threshold || 5,
        offline_threshold_minutes: deviceGroup?.offline_threshold_minutes || 5,
        signal_low_threshold: deviceGroup?.signal_low_threshold || 2,
        low_balance_threshold: deviceGroup?.low_balance_threshold || '10.00',
        enable_battery_alarms: deviceGroup?.enable_battery_alarms ?? true,
        enable_error_alarms: deviceGroup?.enable_error_alarms ?? true,
        enable_offline_alarms: deviceGroup?.enable_offline_alarms ?? true,
        enable_signal_alarms: deviceGroup?.enable_signal_alarms ?? true,
        enable_sim_balance_alarms: deviceGroup?.enable_sim_balance_alarms ?? true,
        auto_disable_sim_on_alarm: deviceGroup?.auto_disable_sim_on_alarm ?? false,
        sim1_daily_sms_limit: deviceGroup?.sim1_daily_sms_limit || 100,
        sim1_monthly_sms_limit: deviceGroup?.sim1_monthly_sms_limit || 1000,
        sim2_daily_sms_limit: deviceGroup?.sim2_daily_sms_limit || 100,
        sim2_monthly_sms_limit: deviceGroup?.sim2_monthly_sms_limit || 1000,
        enable_sms_limits: deviceGroup?.enable_sms_limits ?? false,
        sms_limit_reset_hour: deviceGroup?.sms_limit_reset_hour || 0,
        sim1_guard_interval: deviceGroup?.sim1_guard_interval || 1,
        sim2_guard_interval: deviceGroup?.sim2_guard_interval || 1,
    });

    const handleInputChange = (field: string, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                if (!formData.device_group.trim()) {
                    newErrors.device_group = 'Device group name is required';
                }
                if (!formData.country_site_id) {
                    newErrors.country_site = 'Country site is required';
                }
                break;
            case 2:
                if (formData.battery_low_threshold < 0 || formData.battery_low_threshold > 100) {
                    newErrors.battery_low_threshold = 'Battery threshold must be between 0 and 100';
                }
                if (formData.error_count_threshold < 1) {
                    newErrors.error_count_threshold = 'Error count threshold must be at least 1';
                }
                if (formData.offline_threshold_minutes < 1) {
                    newErrors.offline_threshold_minutes = 'Offline threshold must be at least 1 minute';
                }
                if (formData.signal_low_threshold < 0) {
                    newErrors.signal_low_threshold = 'Signal threshold must be at least 0';
                }
                break;
            case 4:
                if (formData.sim1_daily_sms_limit < 0) {
                    newErrors.sim1_daily_sms_limit = 'Daily SMS limit must be at least 0';
                }
                if (formData.sim1_monthly_sms_limit < 0) {
                    newErrors.sim1_monthly_sms_limit = 'Monthly SMS limit must be at least 0';
                }
                if (formData.sim2_daily_sms_limit < 0) {
                    newErrors.sim2_daily_sms_limit = 'Daily SMS limit must be at least 0';
                }
                if (formData.sim2_monthly_sms_limit < 0) {
                    newErrors.sim2_monthly_sms_limit = 'Monthly SMS limit must be at least 0';
                }
                if (formData.sms_limit_reset_hour < 0 || formData.sms_limit_reset_hour > 23) {
                    newErrors.sms_limit_reset_hour = 'Reset hour must be between 0 and 23';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                // Ensure country site fields are properly set
                country_site_id: formData.country_site_id || 0,
                country_site: formData.country_site || ''
            };

            if (deviceGroup) {
                await deviceGroupService.updateDeviceGroup(deviceGroup.id, submitData);
                toast.success('Device group updated successfully');
            } else {
                await deviceGroupService.createDeviceGroup(submitData);
                toast.success('Device group created successfully');
            }
            onSuccess();
        } catch (error: any) {
            if (error.errors) {
                setErrors(error.errors);
            } else {
                toast.error('Failed to save device group');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="device_group" className="text-base font-medium">
                                    Device Group Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="device_group"
                                    value={formData.device_group}
                                    onChange={(e) => handleInputChange('device_group', e.target.value)}
                                    placeholder="Enter device group name"
                                    className={errors.device_group ? 'border-destructive' : ''}
                                />
                                {errors.device_group && (
                                    <p className="text-sm text-destructive">{errors.device_group}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country_site" className="text-base font-medium">
                                    Country Site <span className="text-destructive">*</span>
                                </Label>
                                <Select value={formData.country_site_id ? formData.country_site_id.toString() : ''} onValueChange={(value) => {
                                    const selectedCountrySite = countrySites.find(s => s.id.toString() === value);
                                    handleInputChange('country_site_id', value ? parseInt(value) : 0);
                                    handleInputChange('country_site', selectedCountrySite?.country_site || '');
                                    
                                    // Clear error when user selects a country site
                                    if (errors.country_site) {
                                        setErrors(prev => ({ ...prev, country_site: '' }));
                                    }
                                }}>
                                    <SelectTrigger className={errors.country_site ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select a country site (required)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countrySites.length === 0 ? (
                                            <SelectItem value="no-country-sites" disabled>No country sites available</SelectItem>
                                        ) : (
                                            countrySites.map((countrySite) => (
                                                <SelectItem key={countrySite.id} value={countrySite.id.toString()}>{countrySite.country_site}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {countrySites.length === 0 && (
                                    <p className="text-sm text-yellow-600">
                                        A country site must be selected to create a device group.
                                    </p>
                                )}
                                {errors.sitename && (
                                    <p className="text-sm text-destructive">{errors.sitename}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="device_type" className="text-base font-medium">
                                    Device Type
                                </Label>
                                <Select value={formData.device_type} onValueChange={(value) => handleInputChange('device_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="android">Android</SelectItem>
                                        <SelectItem value="usb_modem">USB Modem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-base font-medium">
                                    Status
                                </Label>
                                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>


                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="battery_low_threshold" className="text-base font-medium">
                                    Battery Low Threshold (%)
                                </Label>
                                <Input
                                    id="battery_low_threshold"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.battery_low_threshold}
                                    onChange={(e) => handleInputChange('battery_low_threshold', parseInt(e.target.value) || 0)}
                                    className={errors.battery_low_threshold ? 'border-destructive' : ''}
                                />
                                {errors.battery_low_threshold && (
                                    <p className="text-sm text-destructive">{errors.battery_low_threshold}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="error_count_threshold" className="text-base font-medium">
                                    Error Count Threshold
                                </Label>
                                <Input
                                    id="error_count_threshold"
                                    type="number"
                                    min="1"
                                    value={formData.error_count_threshold}
                                    onChange={(e) => handleInputChange('error_count_threshold', parseInt(e.target.value) || 0)}
                                    className={errors.error_count_threshold ? 'border-destructive' : ''}
                                />
                                {errors.error_count_threshold && (
                                    <p className="text-sm text-destructive">{errors.error_count_threshold}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="offline_threshold_minutes" className="text-base font-medium">
                                    Offline Threshold (minutes)
                                </Label>
                                <Input
                                    id="offline_threshold_minutes"
                                    type="number"
                                    min="1"
                                    value={formData.offline_threshold_minutes}
                                    onChange={(e) => handleInputChange('offline_threshold_minutes', parseInt(e.target.value) || 0)}
                                    className={errors.offline_threshold_minutes ? 'border-destructive' : ''}
                                />
                                {errors.offline_threshold_minutes && (
                                    <p className="text-sm text-destructive">{errors.offline_threshold_minutes}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="signal_low_threshold" className="text-base font-medium">
                                    Signal Low Threshold
                                </Label>
                                <Input
                                    id="signal_low_threshold"
                                    type="number"
                                    min="0"
                                    value={formData.signal_low_threshold}
                                    onChange={(e) => handleInputChange('signal_low_threshold', parseInt(e.target.value) || 0)}
                                    className={errors.signal_low_threshold ? 'border-destructive' : ''}
                                />
                                {errors.signal_low_threshold && (
                                    <p className="text-sm text-destructive">{errors.signal_low_threshold}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="low_balance_threshold" className="text-base font-medium">
                                Low Balance Threshold
                            </Label>
                            <Input
                                id="low_balance_threshold"
                                value={formData.low_balance_threshold}
                                onChange={(e) => handleInputChange('low_balance_threshold', e.target.value)}
                                placeholder="10.00"
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Battery className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <Label className="text-base font-medium">Battery Alarms</Label>
                                        <p className="text-sm text-muted-foreground">Enable battery level monitoring</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enable_battery_alarms}
                                    onCheckedChange={(checked) => handleInputChange('enable_battery_alarms', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    <div>
                                        <Label className="text-base font-medium">Error Alarms</Label>
                                        <p className="text-sm text-muted-foreground">Enable error monitoring</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enable_error_alarms}
                                    onCheckedChange={(checked) => handleInputChange('enable_error_alarms', checked)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Wifi className="h-5 w-5 text-orange-500" />
                                    <div>
                                        <Label className="text-base font-medium">Offline Alarms</Label>
                                        <p className="text-sm text-muted-foreground">Enable offline monitoring</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enable_offline_alarms}
                                    onCheckedChange={(checked) => handleInputChange('enable_offline_alarms', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Signal className="h-5 w-5 text-green-500" />
                                    <div>
                                        <Label className="text-base font-medium">Signal Alarms</Label>
                                        <p className="text-sm text-muted-foreground">Enable signal monitoring</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enable_signal_alarms}
                                    onCheckedChange={(checked) => handleInputChange('enable_signal_alarms', checked)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <CreditCard className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <Label className="text-base font-medium">SIM Balance Alarms</Label>
                                        <p className="text-sm text-muted-foreground">Enable balance monitoring</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.enable_sim_balance_alarms}
                                    onCheckedChange={(checked) => handleInputChange('enable_sim_balance_alarms', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <Label className="text-base font-medium">Auto Disable SIM</Label>
                                        <p className="text-sm text-muted-foreground">Disable SIM on alarm</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.auto_disable_sim_on_alarm}
                                    onCheckedChange={(checked) => handleInputChange('auto_disable_sim_on_alarm', checked)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                                <div>
                                    <Label className="text-base font-medium">Enable SMS Limits</Label>
                                    <p className="text-sm text-muted-foreground">Enable daily and monthly SMS limits</p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.enable_sms_limits}
                                onCheckedChange={(checked) => handleInputChange('enable_sms_limits', checked)}
                            />
                        </div>

                        {formData.enable_sms_limits && (
                            <>
                                <Separator />
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="sim1_daily_sms_limit" className="text-base font-medium">
                                                SIM 1 Daily Limit
                                            </Label>
                                            <Input
                                                id="sim1_daily_sms_limit"
                                                type="number"
                                                min="0"
                                                value={formData.sim1_daily_sms_limit}
                                                onChange={(e) => handleInputChange('sim1_daily_sms_limit', parseInt(e.target.value) || 0)}
                                                className={errors.sim1_daily_sms_limit ? 'border-destructive' : ''}
                                            />
                                            {errors.sim1_daily_sms_limit && (
                                                <p className="text-sm text-destructive">{errors.sim1_daily_sms_limit}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sim1_monthly_sms_limit" className="text-base font-medium">
                                                SIM 1 Monthly Limit
                                            </Label>
                                            <Input
                                                id="sim1_monthly_sms_limit"
                                                type="number"
                                                min="0"
                                                value={formData.sim1_monthly_sms_limit}
                                                onChange={(e) => handleInputChange('sim1_monthly_sms_limit', parseInt(e.target.value) || 0)}
                                                className={errors.sim1_monthly_sms_limit ? 'border-destructive' : ''}
                                            />
                                            {errors.sim1_monthly_sms_limit && (
                                                <p className="text-sm text-destructive">{errors.sim1_monthly_sms_limit}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="sim2_daily_sms_limit" className="text-base font-medium">
                                                SIM 2 Daily Limit
                                            </Label>
                                            <Input
                                                id="sim2_daily_sms_limit"
                                                type="number"
                                                min="0"
                                                value={formData.sim2_daily_sms_limit}
                                                onChange={(e) => handleInputChange('sim2_daily_sms_limit', parseInt(e.target.value) || 0)}
                                                className={errors.sim2_daily_sms_limit ? 'border-destructive' : ''}
                                            />
                                            {errors.sim2_daily_sms_limit && (
                                                <p className="text-sm text-destructive">{errors.sim2_daily_sms_limit}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sim2_monthly_sms_limit" className="text-base font-medium">
                                                SIM 2 Monthly Limit
                                            </Label>
                                            <Input
                                                id="sim2_monthly_sms_limit"
                                                type="number"
                                                min="0"
                                                value={formData.sim2_monthly_sms_limit}
                                                onChange={(e) => handleInputChange('sim2_monthly_sms_limit', parseInt(e.target.value) || 0)}
                                                className={errors.sim2_monthly_sms_limit ? 'border-destructive' : ''}
                                            />
                                            {errors.sim2_monthly_sms_limit && (
                                                <p className="text-sm text-destructive">{errors.sim2_monthly_sms_limit}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="sms_limit_reset_hour" className="text-base font-medium">
                                                Reset Hour (0-23)
                                            </Label>
                                            <Input
                                                id="sms_limit_reset_hour"
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={formData.sms_limit_reset_hour}
                                                onChange={(e) => handleInputChange('sms_limit_reset_hour', parseInt(e.target.value) || 0)}
                                                className={errors.sms_limit_reset_hour ? 'border-destructive' : ''}
                                            />
                                            {errors.sms_limit_reset_hour && (
                                                <p className="text-sm text-destructive">{errors.sms_limit_reset_hour}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sim1_guard_interval" className="text-base font-medium">
                                                SIM 1 Guard Interval (minutes)
                                            </Label>
                                            <Input
                                                id="sim1_guard_interval"
                                                type="number"
                                                min="1"
                                                value={formData.sim1_guard_interval}
                                                onChange={(e) => handleInputChange('sim1_guard_interval', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sim2_guard_interval" className="text-base font-medium">
                                            SIM 2 Guard Interval (minutes)
                                        </Label>
                                        <Input
                                            id="sim2_guard_interval"
                                            type="number"
                                            min="1"
                                            value={formData.sim2_guard_interval}
                                            onChange={(e) => handleInputChange('sim2_guard_interval', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div><strong>Device Group:</strong> {formData.device_group || 'Not set'}</div>
                                <div><strong>Country Site:</strong> {formData.country_site || 'Not set'}</div>
                                <div><strong>Device Type:</strong> {formData.device_type}</div>
                                <div><strong>Status:</strong> {formData.status}</div>
                                <div><strong>WebSocket URL:</strong> {formData.websocket_url || 'Not set'}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Device Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div><strong>Battery Threshold:</strong> {formData.battery_low_threshold}%</div>
                                <div><strong>Error Count Threshold:</strong> {formData.error_count_threshold}</div>
                                <div><strong>Offline Threshold:</strong> {formData.offline_threshold_minutes} minutes</div>
                                <div><strong>Signal Threshold:</strong> {formData.signal_low_threshold}</div>
                                <div><strong>Balance Threshold:</strong> {formData.low_balance_threshold}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Alarm Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        {formData.enable_battery_alarms ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
                                        <span>Battery Alarms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {formData.enable_error_alarms ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
                                        <span>Error Alarms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {formData.enable_offline_alarms ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
                                        <span>Offline Alarms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {formData.enable_signal_alarms ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
                                        <span>Signal Alarms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {formData.enable_sim_balance_alarms ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
                                        <span>SIM Balance Alarms</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {formData.auto_disable_sim_on_alarm ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-400" />}
                                        <span>Auto Disable SIM</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {formData.enable_sms_limits && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        SMS Limits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><strong>SIM 1 Daily:</strong> {formData.sim1_daily_sms_limit}</div>
                                        <div><strong>SIM 1 Monthly:</strong> {formData.sim1_monthly_sms_limit}</div>
                                        <div><strong>SIM 2 Daily:</strong> {formData.sim2_daily_sms_limit}</div>
                                        <div><strong>SIM 2 Monthly:</strong> {formData.sim2_monthly_sms_limit}</div>
                                    </div>
                                    <div><strong>Reset Hour:</strong> {formData.sms_limit_reset_hour}:00</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><strong>SIM 1 Guard:</strong> {formData.sim1_guard_interval} min</div>
                                        <div><strong>SIM 2 Guard:</strong> {formData.sim2_guard_interval} min</div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            currentStep >= step.id 
                                ? 'bg-primary border-primary text-primary-foreground' 
                                : 'bg-background border-muted-foreground text-muted-foreground'
                        }`}>
                            {currentStep > step.id ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <step.icon className="h-5 w-5" />
                            )}
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`w-20 h-0.5 mx-2 ${
                                currentStep > step.id ? 'bg-primary' : 'bg-muted'
                            }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Title */}
            <div className="text-center">
                <h2 className="text-2xl font-bold">{steps[currentStep - 1].title}</h2>
                <p className="text-muted-foreground">Step {currentStep} of {steps.length}</p>
            </div>

            {/* Step Content */}
            <Card>
                <CardContent className="pt-6">
                    {renderStepContent()}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                {currentStep < steps.length ? (
                    <Button onClick={handleNext}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Saving...' : deviceGroup ? 'Update Device Group' : 'Create Device Group'}
                    </Button>
                )}
            </div>

            {/* Cancel Button */}
            <div className="text-center">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
} 