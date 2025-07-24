import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deviceGroupService, type DeviceGroup } from '@/services/device-groups';
import { apiClient } from '@/services/api-client';
import { toast } from 'sonner';
import { 
    Building2, 
    Settings, 
    AlertTriangle, 
    Battery, 
    Wifi, 
    Clock, 
    CreditCard, 
    CheckCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';



interface Props {
    deviceGroup?: DeviceGroup | null;
    sitenames: Array<{ id: number; sitename: string }>;
    onSuccess: () => void;
    onCancel: () => void;
}

const steps = [
    { id: 1, title: 'Basic Information', icon: Building2 },
    { id: 2, title: 'Alarm Settings', icon: AlertTriangle },
    { id: 3, title: 'SMS Limits', icon: CreditCard },
    { id: 4, title: 'Auto Actions', icon: Settings },
    { id: 5, title: 'Review & Save', icon: CheckCircle },
];

export default function DeviceGroupForm({ deviceGroup, sitenames, onSuccess, onCancel }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({
        device_group: deviceGroup?.device_group || '',
        description: '', // Description field doesn't exist in DeviceGroup interface
        sitename: deviceGroup?.sitename || '',
        sitename_id: deviceGroup?.sitename_id || 0,
        device_type: deviceGroup?.device_type || 'android',
        status: deviceGroup?.status || 'inactive',
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
        auto_disable_sim_on_alarm: deviceGroup ? (deviceGroup.auto_disable_sim_on_alarm ?? false) : false,
        sim1_daily_sms_limit: deviceGroup?.sim1_daily_sms_limit || 100,
        sim1_monthly_sms_limit: deviceGroup?.sim1_monthly_sms_limit || 1000,
        sim2_daily_sms_limit: deviceGroup?.sim2_daily_sms_limit || 100,
        sim2_monthly_sms_limit: deviceGroup?.sim2_monthly_sms_limit || 1000,
        enable_sms_limits: deviceGroup?.enable_sms_limits ?? false,
        sms_limit_reset_hour: deviceGroup?.sms_limit_reset_hour || 0,
        sim1_guard_interval: deviceGroup?.sim1_guard_interval || 1,
        sim2_guard_interval: deviceGroup?.sim2_guard_interval || 1,
    });

    // Update form data when deviceGroup prop changes
    useEffect(() => {
        if (deviceGroup && deviceGroup.id) {
            setFormData({
                device_group: deviceGroup.device_group || '',
                description: '', // Description field doesn't exist in DeviceGroup interface
                sitename: deviceGroup.sitename || '',
                sitename_id: deviceGroup.sitename_id || 0,
                device_type: deviceGroup.device_type || 'android',
                status: deviceGroup.status || 'inactive',
                battery_low_threshold: deviceGroup.battery_low_threshold || 20,
                error_count_threshold: deviceGroup.error_count_threshold || 5,
                offline_threshold_minutes: deviceGroup.offline_threshold_minutes || 5,
                signal_low_threshold: deviceGroup.signal_low_threshold || 2,
                low_balance_threshold: String(deviceGroup.low_balance_threshold || '10.00'),
                enable_battery_alarms: deviceGroup.enable_battery_alarms ?? true,
                enable_error_alarms: deviceGroup.enable_error_alarms ?? true,
                enable_offline_alarms: deviceGroup.enable_offline_alarms ?? true,
                enable_signal_alarms: deviceGroup.enable_signal_alarms ?? true,
                enable_sim_balance_alarms: deviceGroup.enable_sim_balance_alarms ?? true,
                auto_disable_sim_on_alarm: deviceGroup.auto_disable_sim_on_alarm ?? false,
                sim1_daily_sms_limit: deviceGroup.sim1_daily_sms_limit || 100,
                sim1_monthly_sms_limit: deviceGroup.sim1_monthly_sms_limit || 1000,
                sim2_daily_sms_limit: deviceGroup.sim2_daily_sms_limit || 100,
                sim2_monthly_sms_limit: deviceGroup.sim2_monthly_sms_limit || 1000,
                enable_sms_limits: deviceGroup.enable_sms_limits ?? false,
                sms_limit_reset_hour: deviceGroup.sms_limit_reset_hour || 0,
                sim1_guard_interval: deviceGroup.sim1_guard_interval || 1,
                sim2_guard_interval: deviceGroup.sim2_guard_interval || 1,
            });
        } else {
            // Reset to defaults when no deviceGroup or creating new
            setFormData({
                device_group: '',
                description: '',
                sitename: '',
                sitename_id: 0,
                device_type: 'android',
                status: 'inactive',
                battery_low_threshold: 20,
                error_count_threshold: 5,
                offline_threshold_minutes: 5,
                signal_low_threshold: 2,
                low_balance_threshold: '10.00',
                enable_battery_alarms: true,
                enable_error_alarms: true,
                enable_offline_alarms: true,
                enable_signal_alarms: true,
                enable_sim_balance_alarms: true,
                auto_disable_sim_on_alarm: false,
                sim1_daily_sms_limit: 100,
                sim1_monthly_sms_limit: 1000,
                sim2_daily_sms_limit: 100,
                sim2_monthly_sms_limit: 1000,
                enable_sms_limits: false,
                sms_limit_reset_hour: 0,
                sim1_guard_interval: 1,
                sim2_guard_interval: 1,
            });
        }
    }, [deviceGroup]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form before submission
        const errors: Record<string, string> = {};
        
        // Device group name validation
        if (!formData.device_group.trim()) {
            errors.device_group = 'Group name is required';
        } else {
            // Alphanumeric validation (no spaces, only letters, numbers, and underscores)
            const alphanumericRegex = /^[a-zA-Z0-9_]+$/;
            if (!alphanumericRegex.test(formData.device_group)) {
                errors.device_group = 'Group name can only contain letters, numbers, and underscores (no spaces or special characters)';
            }
            
            // Length validation
            if (formData.device_group.length < 3) {
                errors.device_group = 'Group name must be at least 3 characters long';
            } else if (formData.device_group.length > 50) {
                errors.device_group = 'Group name cannot exceed 50 characters';
            }
        }
        
        // Sitename validation
        if (!formData.sitename_id) {
            errors.sitename = 'Sitename is required';
        }
        
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        
        setErrors({});

        // Ensure sitename fields are properly set
        setFormData(prev => ({
            ...prev,
            sitename_id: prev.sitename_id || 0,
            sitename: prev.sitename || ''
        }));

        try {
            setProcessing(true);
            if (deviceGroup) {
                await deviceGroupService.updateDeviceGroup(deviceGroup.id, formData);
                toast.success('Device group updated successfully');
            } else {
                await deviceGroupService.createDeviceGroup(formData);
                toast.success('Device group created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Form submission error:', error);
            toast.error('Failed to save device group');
        } finally {
            setProcessing(false);
        }
    };

    const nextStep = () => {
        // Validate current step before proceeding
        if (currentStep === 1) {
            const errors: Record<string, string> = {};
            
            // Device group name validation
            if (!formData.device_group.trim()) {
                errors.device_group = 'Group name is required';
            } else {
                // Alphanumeric validation (no spaces, only letters, numbers, and underscores)
                const alphanumericRegex = /^[a-zA-Z0-9_]+$/;
                if (!alphanumericRegex.test(formData.device_group)) {
                    errors.device_group = 'Group name can only contain letters, numbers, and underscores (no spaces or special characters)';
                }
                
                // Length validation
                if (formData.device_group.length < 3) {
                    errors.device_group = 'Group name must be at least 3 characters long';
                } else if (formData.device_group.length > 50) {
                    errors.device_group = 'Group name cannot exceed 50 characters';
                }
            }
            
            // Sitename validation
            if (!formData.sitename_id) {
                errors.sitename = 'Sitename is required';
            }
            
            if (Object.keys(errors).length > 0) {
                setErrors(errors);
                return;
            }
        }
        
        if (currentStep < steps.length) {
            setErrors({}); // Clear any previous errors
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getActiveAlarmsCount = () => {
        let count = 0;
        if (formData.enable_battery_alarms) count++;
        if (formData.enable_error_alarms) count++;
        if (formData.enable_offline_alarms) count++;
        if (formData.enable_signal_alarms) count++;
        if (formData.enable_sim_balance_alarms) count++;
        return count;
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    
                    return (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                isActive 
                                    ? 'border-primary bg-primary text-primary-foreground' 
                                    : isCompleted 
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : 'border-muted-foreground text-muted-foreground'
                            }`}>
                                {isCompleted ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <Icon className="h-5 w-5" />
                                )}
                            </div>
                            <div className="ml-3">
                                <div className={`text-sm font-medium ${
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                    {step.title}
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-4 ${
                                    isCompleted ? 'bg-green-500' : 'bg-muted-foreground'
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderBasicInformation = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="device_group">Group Name *</Label>
                <Input
                    id="device_group"
                    value={formData.device_group}
                    onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, device_group: value }));
                        
                        // Clear error when user starts typing
                        if (errors.device_group) {
                            setErrors(prev => ({ ...prev, device_group: '' }));
                        }
                    }}
                    placeholder="Enter device group name (letters, numbers, underscores only)"
                    className={errors.device_group ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                    Only letters, numbers, and underscores allowed. 3-50 characters.
                </p>
                {errors.device_group && (
                    <p className="text-sm text-destructive">{errors.device_group}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter group description"
                    rows={3}
                />
                {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="sitename">Sitename *</Label>
                <Select value={formData.sitename_id ? formData.sitename_id.toString() : ''} onValueChange={(value) => {
                    const selectedSitename = sitenames.find(s => s.id.toString() === value);
                    setFormData(prev => ({
                        ...prev,
                        sitename_id: value ? parseInt(value) : 0,
                        sitename: selectedSitename?.sitename || ''
                    }));
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select sitename" />
                    </SelectTrigger>
                    <SelectContent>
                        {sitenames.map((sitename) => (
                            <SelectItem key={sitename.id} value={sitename.id.toString()}>{sitename.sitename}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.sitename && (
                    <p className="text-sm text-destructive">{errors.sitename}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="device_type">Device Type</Label>
                    <Select value={formData.device_type} onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, device_type: value }));
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="android">Android</SelectItem>
                            <SelectItem value="usb_modem">USB Modem</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.device_type && (
                        <p className="text-sm text-destructive">{errors.device_type}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, status: value }));
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.status && (
                        <p className="text-sm text-destructive">{errors.status}</p>
                    )}
                </div>
            </div>


        </div>
    );

    const renderAlarmSettings = () => (
        <div className="space-y-6">
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Configure alarm thresholds and enable/disable specific alarm types for this device group.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Battery Alarms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Battery className="h-4 w-4" />
                            Battery Alarms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enable_battery_alarms"
                                checked={formData.enable_battery_alarms}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_battery_alarms: checked as boolean }))}
                            />
                            <Label htmlFor="enable_battery_alarms">Enable Battery Alarms</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="battery_low_threshold">Low Battery Threshold (%)</Label>
                            <Input
                                id="battery_low_threshold"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.battery_low_threshold}
                                onChange={(e) => setFormData(prev => ({ ...prev, battery_low_threshold: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Error Alarms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Error Alarms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enable_error_alarms"
                                checked={formData.enable_error_alarms}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_error_alarms: checked as boolean }))}
                            />
                            <Label htmlFor="enable_error_alarms">Enable Error Alarms</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="error_count_threshold">Error Count Threshold</Label>
                            <Input
                                id="error_count_threshold"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.error_count_threshold}
                                onChange={(e) => setFormData(prev => ({ ...prev, error_count_threshold: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Offline Alarms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            Offline Alarms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enable_offline_alarms"
                                checked={formData.enable_offline_alarms}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_offline_alarms: checked as boolean }))}
                            />
                            <Label htmlFor="enable_offline_alarms">Enable Offline Alarms</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="offline_threshold_minutes">Offline Threshold (minutes)</Label>
                            <Input
                                id="offline_threshold_minutes"
                                type="number"
                                min="1"
                                max="1440"
                                value={formData.offline_threshold_minutes}
                                onChange={(e) => setFormData(prev => ({ ...prev, offline_threshold_minutes: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Signal Alarms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Wifi className="h-4 w-4" />
                            Signal Alarms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enable_signal_alarms"
                                checked={formData.enable_signal_alarms}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_signal_alarms: checked as boolean }))}
                            />
                            <Label htmlFor="enable_signal_alarms">Enable Signal Alarms</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signal_low_threshold">Low Signal Threshold (%)</Label>
                            <Input
                                id="signal_low_threshold"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.signal_low_threshold}
                                onChange={(e) => setFormData(prev => ({ ...prev, signal_low_threshold: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Balance Alarms */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4" />
                            SIM Balance Alarms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enable_sim_balance_alarms"
                                checked={formData.enable_sim_balance_alarms}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_sim_balance_alarms: checked as boolean }))}
                            />
                            <Label htmlFor="enable_sim_balance_alarms">Enable SIM Balance Alarms</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="low_balance_threshold">Low Balance Threshold (₺)</Label>
                            <Input
                                id="low_balance_threshold"
                                type="number"
                                min="0"
                                max="1000"
                                step="0.01"
                                value={formData.low_balance_threshold}
                                onChange={(e) => setFormData(prev => ({ ...prev, low_balance_threshold: e.target.value }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-sm">
                    <span className="font-medium">Active Alarms:</span> {getActiveAlarmsCount()}
                </div>
                <Badge variant={getActiveAlarmsCount() > 0 ? 'default' : 'secondary'}>
                    {getActiveAlarmsCount() > 0 ? 'Alarms Configured' : 'No Alarms'}
                </Badge>
            </div>
        </div>
    );

    const renderSmsLimits = () => (
        <div className="space-y-6">
            <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                    Configure SMS sending limits and throttle (guard timer) for each SIM card in this device group. Limits help control costs and prevent abuse. Guard timer enforces a minimum delay between SMS sends.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        SMS Limits & Guard Timer Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="enable_sms_limits"
                            checked={formData.enable_sms_limits}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_sms_limits: checked as boolean }))}
                        />
                        <Label htmlFor="enable_sms_limits">
                            Enable SMS sending limits
                        </Label>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="sms_limit_reset_hour">Limit Reset Hour (0-23)</Label>
                            <Input
                                id="sms_limit_reset_hour"
                                type="number"
                                min="0"
                                max="23"
                                value={formData.sms_limit_reset_hour}
                                onChange={(e) => setFormData(prev => ({ ...prev, sms_limit_reset_hour: parseInt(e.target.value) }))}
                                placeholder="0"
                            />
                            <p className="text-xs text-muted-foreground">
                                Hour of day when daily limits reset (0 = midnight, 12 = noon, etc.)
                            </p>
                        </div>
                        <Separator />
                        {/* SIM 1 Limits & Guard Timer */}
                        <h4 className="font-medium">Slot 1 Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sim1_daily_sms_limit">Daily SMS Limit</Label>
                                <Input
                                    id="sim1_daily_sms_limit"
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={formData.sim1_daily_sms_limit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sim1_daily_sms_limit: parseInt(e.target.value) }))}
                                    placeholder="100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sim1_monthly_sms_limit">Monthly SMS Limit</Label>
                                <Input
                                    id="sim1_monthly_sms_limit"
                                    type="number"
                                    min="0"
                                    max="100000"
                                    value={formData.sim1_monthly_sms_limit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sim1_monthly_sms_limit: parseInt(e.target.value) }))}
                                    placeholder="3000"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="sim1_guard_interval">Guard Timer (seconds)</Label>
                                <Input
                                    id="sim1_guard_interval"
                                    type="number"
                                    min="0"
                                    max="3600"
                                    value={formData.sim1_guard_interval}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sim1_guard_interval: parseInt(e.target.value) }))}
                                    placeholder="5"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum delay between two SMS sends for SIM 1 (in seconds).
                                </p>
                            </div>
                        </div>
                        <Separator />
                        {/* SIM 2 Limits & Guard Timer */}
                        <h4 className="font-medium">Slot 2 Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sim2_daily_sms_limit">Daily SMS Limit</Label>
                                <Input
                                    id="sim2_daily_sms_limit"
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={formData.sim2_daily_sms_limit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sim2_daily_sms_limit: parseInt(e.target.value) }))}
                                    placeholder="100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sim2_monthly_sms_limit">Monthly SMS Limit</Label>
                                <Input
                                    id="sim2_monthly_sms_limit"
                                    type="number"
                                    min="0"
                                    max="100000"
                                    value={formData.sim2_monthly_sms_limit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sim2_monthly_sms_limit: parseInt(e.target.value) }))}
                                    placeholder="3000"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="sim2_guard_interval">Guard Timer (seconds)</Label>
                                <Input
                                    id="sim2_guard_interval"
                                    type="number"
                                    min="0"
                                    max="3600"
                                    value={formData.sim2_guard_interval}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sim2_guard_interval: parseInt(e.target.value) }))}
                                    placeholder="5"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum delay between two SMS sends for SIM 2 (in seconds).
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">SMS Limits Summary</h4>
                <div className="space-y-2 text-sm">
                    <div><strong>Status:</strong> {formData.enable_sms_limits ? 'Enabled' : 'Disabled'}</div>
                    {formData.enable_sms_limits && (
                        <>
                            <div><strong>Reset Hour:</strong> {formData.sms_limit_reset_hour}:00</div>
                            <div><strong>SIM1:</strong> {formData.sim1_daily_sms_limit}/day, {formData.sim1_monthly_sms_limit}/month</div>
                            <div><strong>SIM2:</strong> {formData.sim2_daily_sms_limit}/day, {formData.sim2_monthly_sms_limit}/month</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderAutoActions = () => (
        <div className="space-y-6">
            <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                    Configure automatic actions that will be taken when alarms are triggered.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Auto-Disable SIM on Alarm
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto_disable_sim_on_alarm"
                            checked={formData.auto_disable_sim_on_alarm}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_disable_sim_on_alarm: checked as boolean }))}
                        />
                        <Label htmlFor="auto_disable_sim_on_alarm">
                            Automatically disable SIM card when any alarm is triggered
                        </Label>
                    </div>
                    
                    {formData.auto_disable_sim_on_alarm && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                When enabled, the system will automatically disable the SIM card if any of the configured alarms are triggered. 
                                This helps prevent further issues and alerts.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="space-y-2 text-sm">
                    <div><strong>Group Name:</strong> {formData.device_group || 'Not set'}</div>
                    <div><strong>Sitename:</strong> {formData.sitename || 'Not set'}</div>
                    <div><strong>Active Alarms:</strong> {getActiveAlarmsCount()}</div>
                    <div><strong>SMS Limits:</strong> {formData.enable_sms_limits ? 'Enabled' : 'Disabled'}</div>
                    <div><strong>Auto-disable SIM:</strong> {formData.auto_disable_sim_on_alarm ? 'Yes' : 'No'}</div>
                </div>
            </div>
        </div>
    );

    const renderReviewAndSave = () => (
        <div className="space-y-6">
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    REVIEW STEP IS ACTIVE - Step {currentStep} of {steps.length}
                </AlertDescription>
            </Alert>
            
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                    Please review all the information below before saving. You can go back to any step to make changes.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information Review */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><strong>Group Name:</strong> {formData.device_group || 'Not set'}</div>
                        <div><strong>Description:</strong> {formData.description || 'No description'}</div>
                        <div><strong>Sitename:</strong> {formData.sitename || 'Not set'}</div>
                        <div><strong>Device Type:</strong> {formData.device_type === 'android' ? 'Android' : formData.device_type === 'usb_modem' ? 'USB Modem' : formData.device_type}</div>
                        <div><strong>Status:</strong> {formData.status === 'active' ? 'Active' : formData.status === 'inactive' ? 'Inactive' : formData.status === 'maintenance' ? 'Maintenance' : formData.status}</div>
                    </CardContent>
                </Card>

                {/* Alarm Settings Review */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Alarm Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><strong>Battery Alarms:</strong> {formData.enable_battery_alarms ? 'Enabled' : 'Disabled'}</div>
                        {formData.enable_battery_alarms && (
                            <div className="ml-4">Threshold: {formData.battery_low_threshold}%</div>
                        )}
                        <div><strong>Error Alarms:</strong> {formData.enable_error_alarms ? 'Enabled' : 'Disabled'}</div>
                        {formData.enable_error_alarms && (
                            <div className="ml-4">Threshold: {formData.error_count_threshold}</div>
                        )}
                        <div><strong>Offline Alarms:</strong> {formData.enable_offline_alarms ? 'Enabled' : 'Disabled'}</div>
                        {formData.enable_offline_alarms && (
                            <div className="ml-4">Threshold: {formData.offline_threshold_minutes} minutes</div>
                        )}
                        <div><strong>Signal Alarms:</strong> {formData.enable_signal_alarms ? 'Enabled' : 'Disabled'}</div>
                        {formData.enable_signal_alarms && (
                            <div className="ml-4">Threshold: {formData.signal_low_threshold}%</div>
                        )}
                        <div><strong>Balance Alarms:</strong> {formData.enable_sim_balance_alarms ? 'Enabled' : 'Disabled'}</div>
                        {formData.enable_sim_balance_alarms && (
                            <div className="ml-4">Threshold: ₺{formData.low_balance_threshold}</div>
                        )}
                    </CardContent>
                </Card>

                {/* SMS Limits Review */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4" />
                            SMS Limits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><strong>SMS Limits:</strong> {formData.enable_sms_limits ? 'Enabled' : 'Disabled'}</div>
                        {formData.enable_sms_limits && (
                            <>
                                <div><strong>Reset Hour:</strong> {formData.sms_limit_reset_hour}:00</div>
                                <div><strong>SIM1 Daily:</strong> {formData.sim1_daily_sms_limit}</div>
                                <div><strong>SIM1 Monthly:</strong> {formData.sim1_monthly_sms_limit}</div>
                                <div><strong>SIM1 Guard:</strong> {formData.sim1_guard_interval}s</div>
                                <div><strong>SIM2 Daily:</strong> {formData.sim2_daily_sms_limit}</div>
                                <div><strong>SIM2 Monthly:</strong> {formData.sim2_monthly_sms_limit}</div>
                                <div><strong>SIM2 Guard:</strong> {formData.sim2_guard_interval}s</div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Auto Actions Review */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Settings className="h-4 w-4" />
                            Auto Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><strong>Auto-disable SIM:</strong> {formData.auto_disable_sim_on_alarm ? 'Yes' : 'No'}</div>
                        {formData.auto_disable_sim_on_alarm && (
                            <div className="text-muted-foreground">
                                SIM will be automatically disabled when any alarm is triggered
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Final Summary</h4>
                <div className="space-y-2 text-sm">
                    <div><strong>Total Active Alarms:</strong> {getActiveAlarmsCount()}</div>
                    <div><strong>SMS Limits Status:</strong> {formData.enable_sms_limits ? 'Enabled' : 'Disabled'}</div>
                    <div><strong>Auto Actions:</strong> {formData.auto_disable_sim_on_alarm ? 'SIM Auto-disable Enabled' : 'No Auto Actions'}</div>
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderBasicInformation();
            case 2:
                return renderAlarmSettings();
            case 3:
                return renderSmsLimits();
            case 4:
                return renderAutoActions();
            case 5:
                return renderReviewAndSave();
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepIndicator()}
            
            {renderCurrentStep()}

            <Separator />

            <div className="flex justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>

                <div className="flex gap-2">
                    {currentStep > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>
                    )}

                    {currentStep < steps.length ? (
                        <Button type="button" onClick={nextStep}>
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Finish'}
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
} 