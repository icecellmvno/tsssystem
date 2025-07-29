import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { smppRoutingsService, type SmppRoutingFilterOptions } from '@/services/smpp-routings';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'SMPP Routings', href: '/smpp-routings' },
    { title: 'Create', href: '/smpp-routings/create' },
];

export default function SmppRoutingCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [filterOptions, setFilterOptions] = useState<SmppRoutingFilterOptions | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        name: '',
        description: '',
        source_type: 'smpp',
        direction: 'inbound',
        system_id: '',
        destination_address: '',
        target_type: 'device_group',
        device_group_ids: [] as number[],
        user_id: '',
        is_active: true,
        priority: 50,
        total_sms_count: 1000,
        
        // Device Selection Strategy
        device_selection_strategy: 'round_robin',
        target_device_ids: [] as string[],
        max_devices_per_message: 1,
        
        // SIM Card Configuration
        sim_slot_preference: 1,
        sim_card_selection_strategy: 'preferred',
    });

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const options = await smppRoutingsService.getFilterOptions();
                setFilterOptions(options);
            } catch (error) {
                console.error('Error fetching filter options:', error);
                toast.error('Failed to fetch filter options');
            }
        };

        fetchFilterOptions();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelect = (name: string, value: string) => {
        setForm((prev) => {
            if (name === 'source_type') {
                return {
                    ...prev,
                    source_type: value,
                    user_id: value === 'http' ? prev.user_id : '',
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Prepare data for API
            const submitData: any = {
                name: form.name,
                description: form.description,
                source_type: form.source_type,
                direction: form.direction,
                destination_address: form.destination_address,
                target_type: form.target_type,
                is_active: form.is_active,
                priority: form.priority,
            };

            // Add source-specific fields
            if (form.source_type === 'smpp' && form.system_id) {
                submitData.system_id = form.system_id;
            }
            if (form.source_type === 'http' && form.user_id) {
                submitData.user_id = parseInt(form.user_id);
            }

            // Add target-specific fields
            if (form.target_type === 'device_group' && form.device_group_ids.length > 0) {
                submitData.device_group_ids = form.device_group_ids;
                submitData.priority = form.priority;
                submitData.total_sms_count = form.total_sms_count;
            }

            // Add device selection strategy fields
            submitData.device_selection_strategy = form.device_selection_strategy;
            submitData.max_devices_per_message = form.max_devices_per_message;
            
            if (form.device_selection_strategy === 'specific' && form.target_device_ids.length > 0) {
                submitData.target_device_ids = form.target_device_ids;
            }

            // Add SIM card configuration fields
            submitData.sim_slot_preference = form.sim_slot_preference;
            submitData.sim_card_selection_strategy = form.sim_card_selection_strategy;

            await smppRoutingsService.create(submitData);
            toast.success('SMPP routing created successfully');
            navigate('/smpp-routings');
        } catch (error: any) {
            console.error('Error creating SMPP routing:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.message || 'Failed to create SMPP routing');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!filterOptions) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-4xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Create SMPP Routing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Name</Label>
                                        <Input 
                                            id="name" 
                                            name="name" 
                                            placeholder="Routing name" 
                                            value={form.name} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="source_type">Source Type</Label>
                                        <Select value={form.source_type} onValueChange={(v) => handleSelect('source_type', v)}>
                                            <SelectTrigger id="source_type" className="w-full">
                                                <SelectValue placeholder="Source Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="smpp">SMPP</SelectItem>
                                                <SelectItem value="http">HTTP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.source_type === 'smpp' && (
                                        <div>
                                            <Label htmlFor="system_id">System ID</Label>
                                            <Select value={form.system_id} onValueChange={(v) => handleSelect('system_id', v)}>
                                                <SelectTrigger id="system_id" className="w-full">
                                                    <SelectValue placeholder="Select System ID" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filterOptions.smpp_users.map((systemId: string) => (
                                                        <SelectItem key={systemId} value={systemId}>{systemId}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {form.source_type === 'http' && (
                                        <div>
                                            <Label htmlFor="user_id">User</Label>
                                            <Select value={form.user_id} onValueChange={(v) => handleSelect('user_id', v)}>
                                                <SelectTrigger id="user_id" className="w-full">
                                                    <SelectValue placeholder="Select User" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filterOptions.users.map((u: any) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="direction">Direction</Label>
                                        <Select value={form.direction} onValueChange={(v) => handleSelect('direction', v)}>
                                            <SelectTrigger id="direction" className="w-full">
                                                <SelectValue placeholder="Direction" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="inbound">Inbound</SelectItem>
                                                <SelectItem value="outbound">Outbound</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input 
                                            id="description" 
                                            name="description" 
                                            placeholder="Description" 
                                            value={form.description} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="target_type">Target Type</Label>
                                        <Select value={form.target_type} onValueChange={(v) => handleSelect('target_type', v)}>
                                            <SelectTrigger id="target_type" className="w-full">
                                                <SelectValue placeholder="Target Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="device_group">Device Group</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.target_type === 'device_group' && (
                                        <div>
                                            <Label htmlFor="device_groups">Device Groups</Label>
                                            <div className="space-y-2">
                                                <Select 
                                                    onValueChange={(value) => {
                                                        const groupId = parseInt(value);
                                                        if (!form.device_group_ids.includes(groupId)) {
                                                            setForm(prev => ({
                                                                ...prev,
                                                                device_group_ids: [...prev.device_group_ids, groupId]
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger id="device_groups" className="w-full">
                                                        <SelectValue placeholder="Select Device Groups" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filterOptions.device_groups
                                                            .filter((g: any) => !form.device_group_ids.includes(g.id))
                                                            .map((g: any) => (
                                                                <SelectItem key={g.id} value={g.id.toString()}>
                                                                    {g.name} {g.queue_name && `(${g.queue_name})`}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                
                                                {form.device_group_ids.length > 0 && (
                                                    <div className="space-y-2">
                                                        {form.device_group_ids.map((groupId) => {
                                                            const selectedGroup = filterOptions.device_groups.find((g: any) => g.id === groupId);
                                                            return selectedGroup ? (
                                                                <div key={groupId} className="p-2 bg-muted rounded-md">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-sm">{selectedGroup.name}</div>
                                                                            {selectedGroup.queue_name && (
                                                                                <div className="text-xs text-muted-foreground">{selectedGroup.queue_name}</div>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setForm(prev => ({
                                                                                    ...prev,
                                                                                    device_group_ids: prev.device_group_ids.filter(id => id !== groupId)
                                                                                }));
                                                                            }}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                        <div className="p-2 bg-blue-50 rounded">
                                                                            <div className="font-medium text-blue-700">Priority</div>
                                                                            <div className="text-blue-600">{selectedGroup.priority || 'N/A'}</div>
                                                                        </div>
                                                                        <div className="p-2 bg-green-50 rounded">
                                                                            <div className="font-medium text-green-700">Total SMS</div>
                                                                            <div className="text-green-600">{selectedGroup.total_sms || 'N/A'}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                                                            <div>
                                            <Label htmlFor="destination_address">Destination Address Pattern</Label>
                                            <Input 
                                                id="destination_address" 
                                                name="destination_address" 
                                                placeholder="* (all addresses), +90* (starting with 90), *123 (ending with 123)" 
                                                value={form.destination_address} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                            <div className="text-sm text-muted-foreground mt-1">
                                                <strong>Examples:</strong><br/>
                                                • <code>*</code> - All phone numbers<br/>
                                                • <code>+90*</code> - Numbers starting with 90<br/>
                                                • <code>*123</code> - Numbers ending with 123<br/>
                                                • <code>+905551234567</code> - Specific number
                                            </div>
                                            {errors.destination_address && <p className="text-sm text-destructive mt-1">{errors.destination_address}</p>}
                                        </div>
                                </div>
                            </div>
                            
                            {/* Device Selection Strategy */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Device Selection Strategy</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label htmlFor="device_selection_strategy">Device Selection Strategy</Label>
                                                                                    <Select 
                                                value={form.device_selection_strategy} 
                                                onValueChange={(value) => handleSelect('device_selection_strategy', value)}
                                            >
                                                <SelectTrigger id="device_selection_strategy" className="w-full">
                                                    <SelectValue placeholder="Select device selection strategy" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="round_robin">Round Robin - Select devices in sequence</SelectItem>
                                                    <SelectItem value="least_used">Least Used - Select least used device</SelectItem>
                                                    <SelectItem value="random">Random - Select random device</SelectItem>
                                                    <SelectItem value="specific">Specific - Select specific devices</SelectItem>
                                                </SelectContent>
                                            </Select>
                                    </div>
                                    
                                    {form.device_selection_strategy === 'specific' && (
                                        <div>
                                            <Label htmlFor="target_device_ids">Target Devices (IMEI)</Label>
                                            <Input 
                                                id="target_device_ids" 
                                                name="target_device_ids" 
                                                placeholder="IMEI1,IMEI2,IMEI3 (virgülle ayırın)" 
                                                value={form.target_device_ids.join(',')} 
                                                onChange={(e) => {
                                                    const deviceIds = e.target.value.split(',').map(id => id.trim()).filter(id => id);
                                                    setForm(prev => ({ ...prev, target_device_ids: deviceIds }));
                                                }}
                                            />
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Enter specific device IMEIs separated by commas
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <Label htmlFor="max_devices_per_message">Max Devices Per Message</Label>
                                        <Input 
                                            id="max_devices_per_message" 
                                            name="max_devices_per_message" 
                                            type="number" 
                                            min={1} 
                                            max={10} 
                                            value={form.max_devices_per_message} 
                                            onChange={(e) => setForm(prev => ({ ...prev, max_devices_per_message: parseInt(e.target.value) || 1 }))}
                                        />
                                        <div className="text-sm text-muted-foreground mt-1">
                                            How many devices to use per message (usually 1)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* SIM Card Configuration */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">SIM Card Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="sim_slot_preference">SIM Slot Preference</Label>
                                        <Select 
                                            value={form.sim_slot_preference.toString()} 
                                            onValueChange={(value) => setForm(prev => ({ ...prev, sim_slot_preference: parseInt(value) }))}
                                        >
                                            <SelectTrigger id="sim_slot_preference" className="w-full">
                                                <SelectValue placeholder="Select SIM slot preference" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                                                            <SelectItem value="1">SIM 1 - Prefer first SIM card</SelectItem>
                                            <SelectItem value="2">SIM 2 - Prefer second SIM card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="sim_card_selection_strategy">SIM Card Selection Strategy</Label>
                                        <Select 
                                            value={form.sim_card_selection_strategy} 
                                            onValueChange={(value) => handleSelect('sim_card_selection_strategy', value)}
                                        >
                                            <SelectTrigger id="sim_card_selection_strategy" className="w-full">
                                                <SelectValue placeholder="Select SIM card selection strategy" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                                                                    <SelectItem value="preferred">Preferred - Use preferred SIM slot</SelectItem>
                                                    <SelectItem value="round_robin">Round Robin - Use SIM slots in sequence</SelectItem>
                                                    <SelectItem value="least_used">Least Used - Use least used SIM slot</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input 
                                        id="priority" 
                                        name="priority" 
                                        type="number" 
                                        min={0} 
                                        max={100} 
                                        value={form.priority} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="total_sms_count">Total SMS Count</Label>
                                    <Input 
                                        id="total_sms_count" 
                                        name="total_sms_count" 
                                        type="number" 
                                        min={1} 
                                        value={form.total_sms_count} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-8">
                                    <input 
                                        type="checkbox" 
                                        name="is_active" 
                                        checked={form.is_active} 
                                        onChange={handleChange} 
                                        id="is_active" 
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                            {Object.keys(errors).length > 0 && (
                                <div className="text-destructive text-sm">
                                    {Object.values(errors).map((err: any, i) => (
                                        <div key={i}>{err}</div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Routing'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => navigate('/smpp-routings')}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 