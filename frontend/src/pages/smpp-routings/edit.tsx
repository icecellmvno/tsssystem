import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    { title: 'Edit', href: '/smpp-routings/edit' },
];

export default function SmppRoutingEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
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
    });

    // Device group configurations state
    const [deviceGroupConfigs, setDeviceGroupConfigs] = useState<Record<number, {
        priority: number;
        total_sms_count: number;
        device_selection_strategy: string;
        sim_card_selection_strategy: string;
        sim_slot_preference: number;
        max_devices_per_message: number;
    }>>({});

    // Fetch routing data and filter options
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [routingData, options] = await Promise.all([
                    smppRoutingsService.getById(parseInt(id!)),
                    smppRoutingsService.getFilterOptions()
                ]);

                setFilterOptions(options);

                // Parse device group IDs from JSON string
                let deviceGroupIds: number[] = [];
                if (routingData.device_group_ids) {
                    try {
                        deviceGroupIds = JSON.parse(routingData.device_group_ids);
                    } catch (e) {
                        console.error('Error parsing device_group_ids:', e);
                    }
                }

                setForm({
                    name: routingData.name,
                    description: routingData.description,
                    source_type: routingData.source_type,
                    direction: routingData.direction,
                    system_id: routingData.system_id || '',
                    destination_address: routingData.destination_address || '',
                    target_type: routingData.target_type,
                    device_group_ids: deviceGroupIds,
                    user_id: routingData.user_id ? String(routingData.user_id) : '',
                    is_active: routingData.is_active,
                });

                // Initialize device group configs with existing data or default values
                const configs: Record<number, any> = {};
                
                // If we have existing device group configs from backend, use them
                if (routingData.device_group_configs && Array.isArray(routingData.device_group_configs)) {
                    routingData.device_group_configs.forEach((config: any) => {
                        configs[config.device_group_id] = {
                            priority: config.priority || 50,
                            total_sms_count: config.total_sms_count || 1000,
                            device_selection_strategy: config.device_selection_strategy || 'round_robin',
                            sim_card_selection_strategy: config.sim_card_selection_strategy || 'preferred',
                            sim_slot_preference: config.sim_slot_preference || 1,
                            max_devices_per_message: config.max_devices_per_message || 1,
                        };
                    });
                }
                
                // For any device groups that don't have configs, use default values
                deviceGroupIds.forEach(groupId => {
                    if (!configs[groupId]) {
                        configs[groupId] = {
                            priority: 50,
                            total_sms_count: 1000,
                            device_selection_strategy: 'round_robin',
                            sim_card_selection_strategy: 'preferred',
                            sim_slot_preference: 1,
                            max_devices_per_message: 1,
                        };
                    }
                });
                setDeviceGroupConfigs(configs);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch routing data');
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

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
                
                // Add device group configurations
                submitData.device_group_configs = form.device_group_ids.map(groupId => ({
                    device_group_id: groupId,
                    ...deviceGroupConfigs[groupId]
                }));
            }

            await smppRoutingsService.update(parseInt(id!), submitData);
            toast.success('SMPP routing updated successfully');
            navigate('/smpp-routings');
        } catch (error: any) {
            console.error('Error updating SMPP routing:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.message || 'Failed to update SMPP routing');
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
                        <CardTitle>Edit SMPP Routing</CardTitle>
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
                                            <div className="space-y-4">
                                                <Select 
                                                    onValueChange={(value) => {
                                                        const groupId = parseInt(value);
                                                        if (!form.device_group_ids.includes(groupId)) {
                                                            setForm(prev => ({
                                                                ...prev,
                                                                device_group_ids: [...prev.device_group_ids, groupId]
                                                            }));
                                                            
                                                            // Initialize device group config for new group
                                                            setDeviceGroupConfigs(prev => ({
                                                                ...prev,
                                                                [groupId]: {
                                                                    priority: 50,
                                                                    total_sms_count: 1000,
                                                                    device_selection_strategy: 'round_robin',
                                                                    sim_card_selection_strategy: 'preferred',
                                                                    sim_slot_preference: 1,
                                                                    max_devices_per_message: 1,
                                                                }
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
                                                                <div key={groupId} className="flex items-center justify-between p-2 bg-muted rounded-md">
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
                                                                            
                                                                            // Remove device group config
                                                                            setDeviceGroupConfigs(prev => {
                                                                                const newConfigs = { ...prev };
                                                                                delete newConfigs[groupId];
                                                                                return newConfigs;
                                                                            });
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
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
                            
                            {/* Device Group Configurations - Moved here */}
                            {form.target_type === 'device_group' && form.device_group_ids.length > 0 && (
                                <div className="border-t pt-6">
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted px-6 py-3 border-b">
                                            <h4 className="font-medium">Device Group Configurations</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Configure individual settings for each selected device group
                                            </p>
                                        </div>
                                        <div className="divide-y">
                                            {form.device_group_ids.map((groupId) => {
                                                const selectedGroup = filterOptions!.device_groups.find((g: any) => g.id === groupId);
                                                return selectedGroup ? (
                                                    <div key={groupId} className="p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-base">{selectedGroup.name}</div>
                                                                {selectedGroup.queue_name && (
                                                                    <div className="text-sm text-muted-foreground">{selectedGroup.queue_name}</div>
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
                                                                    
                                                                    // Remove device group config
                                                                    setDeviceGroupConfigs(prev => {
                                                                        const newConfigs = { ...prev };
                                                                        delete newConfigs[groupId];
                                                                        return newConfigs;
                                                                    });
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                            {/* Priority */}
                                                            <div>
                                                                <Label htmlFor={`priority_${groupId}`} className="text-sm font-medium">Priority</Label>
                                                                <Input 
                                                                    id={`priority_${groupId}`}
                                                                    type="number" 
                                                                    min={0} 
                                                                    max={100} 
                                                                    value={deviceGroupConfigs[groupId]?.priority || 50}
                                                                    onChange={(e) => {
                                                                        setDeviceGroupConfigs(prev => ({
                                                                            ...prev,
                                                                            [groupId]: {
                                                                                ...prev[groupId],
                                                                                priority: parseInt(e.target.value) || 50
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="mt-1"
                                                                />
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    Priority level (0-100)
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Total SMS Count */}
                                                            <div>
                                                                <Label htmlFor={`total_sms_${groupId}`} className="text-sm font-medium">Total SMS</Label>
                                                                <Input 
                                                                    id={`total_sms_${groupId}`}
                                                                    type="number" 
                                                                    min={1} 
                                                                    value={deviceGroupConfigs[groupId]?.total_sms_count || 1000}
                                                                    onChange={(e) => {
                                                                        setDeviceGroupConfigs(prev => ({
                                                                            ...prev,
                                                                            [groupId]: {
                                                                                ...prev[groupId],
                                                                                total_sms_count: parseInt(e.target.value) || 1000
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="mt-1"
                                                                />
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    Total SMS count
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Device Selection Strategy */}
                                                            <div>
                                                                <Label htmlFor={`strategy_${groupId}`} className="text-sm font-medium">Strategy</Label>
                                                                <Select 
                                                                    value={deviceGroupConfigs[groupId]?.device_selection_strategy || 'round_robin'}
                                                                    onValueChange={(value) => {
                                                                        setDeviceGroupConfigs(prev => ({
                                                                            ...prev,
                                                                            [groupId]: {
                                                                                ...prev[groupId],
                                                                                device_selection_strategy: value
                                                                            }
                                                                        }));
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="mt-1">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="round_robin">Round Robin</SelectItem>
                                                                        <SelectItem value="least_used">Least Used</SelectItem>
                                                                        <SelectItem value="random">Random</SelectItem>
                                                                        <SelectItem value="specific">Specific</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    Device selection method
                                                                </div>
                                                            </div>
                                                            
                                                            {/* SIM Configuration */}
                                                            <div>
                                                                <Label htmlFor={`sim_${groupId}`} className="text-sm font-medium">SIM Config</Label>
                                                                <Select 
                                                                    value={deviceGroupConfigs[groupId]?.sim_card_selection_strategy || 'preferred'}
                                                                    onValueChange={(value) => {
                                                                        setDeviceGroupConfigs(prev => ({
                                                                            ...prev,
                                                                            [groupId]: {
                                                                                ...prev[groupId],
                                                                                sim_card_selection_strategy: value,
                                                                                sim_slot_preference: value === 'sim1_preferred' ? 1 : value === 'sim2_preferred' ? 2 : 1
                                                                            }
                                                                        }));
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="mt-1">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="preferred">Preferred</SelectItem>
                                                                        <SelectItem value="round_robin">Round Robin</SelectItem>
                                                                        <SelectItem value="least_used">Least Used</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    SIM card selection
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-6">
                                <input 
                                    type="checkbox" 
                                    name="is_active" 
                                    checked={form.is_active} 
                                    onChange={handleChange} 
                                    id="is_active" 
                                />
                                <Label htmlFor="is_active">Active</Label>
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
                                    {loading ? 'Updating...' : 'Update Routing'}
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