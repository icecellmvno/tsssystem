import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { smppRoutingsService, type SmppRoutingItem, type SmppRoutingFilterOptions } from '@/services/smpp-routings';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'SMPP Routings', href: '/smpp-routings' },
    { title: 'Edit', href: '#' },
];

export default function SmppRoutingEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [routing, setRouting] = useState<SmppRoutingItem | null>(null);
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
        device_group_id: null as number | null,
        user_id: '',
        is_active: true,
        priority: 50,
        
        // Device Selection Strategy
        device_selection_strategy: 'round_robin',
        target_device_ids: [] as string[],
        max_devices_per_message: 1,
        
        // SIM Card Configuration
        sim_slot_preference: 1,
        sim_card_selection_strategy: 'preferred',
    });

    // Fetch routing data and filter options
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                const [routingData, options] = await Promise.all([
                    smppRoutingsService.getById(parseInt(id)),
                    smppRoutingsService.getFilterOptions()
                ]);

                setRouting(routingData);
                setFilterOptions(options);

                // Parse device_group_ids from JSON string and take the first one
                let deviceGroupId: number | null = null;
                if (routingData.device_group_ids) {
                    try {
                        const deviceGroupIds = JSON.parse(routingData.device_group_ids);
                        if (deviceGroupIds && deviceGroupIds.length > 0) {
                            deviceGroupId = deviceGroupIds[0]; // Take the first device group
                        }
                    } catch (e) {
                        console.error('Error parsing device_group_ids:', e);
                    }
                }

                // Parse target device IDs
                let targetDeviceIds: string[] = [];
                if (routingData.target_device_ids) {
                    try {
                        targetDeviceIds = JSON.parse(routingData.target_device_ids);
                    } catch (e) {
                        console.error('Error parsing target_device_ids:', e);
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
                    device_group_id: deviceGroupId,
                    user_id: routingData.user_id ? String(routingData.user_id) : '',
                    is_active: routingData.is_active,
                    priority: routingData.priority,
                    
                    // Device Selection Strategy
                    device_selection_strategy: routingData.device_selection_strategy || 'round_robin',
                    target_device_ids: targetDeviceIds,
                    max_devices_per_message: routingData.max_devices_per_message || 1,
                    
                    // SIM Card Configuration
                    sim_slot_preference: routingData.sim_slot_preference || 1,
                    sim_card_selection_strategy: routingData.sim_card_selection_strategy || 'preferred',
                });
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch routing data');
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelect = (name: string, value: string) => {
        setForm((prev: any) => {
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
        if (!id) return;

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
            if (form.target_type === 'device_group' && form.device_group_id) {
                submitData.device_group_ids = [form.device_group_id];
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

            await smppRoutingsService.update(parseInt(id), submitData);
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

    if (!routing || !filterOptions) {
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
                                            <Label htmlFor="device_group">Device Group</Label>
                                            <Select 
                                                value={form.device_group_id ? form.device_group_id.toString() : ""} 
                                                onValueChange={(value) => {
                                                    const groupId = parseInt(value);
                                                    setForm(prev => ({
                                                        ...prev,
                                                        device_group_id: groupId
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger id="device_group" className="w-full">
                                                    <SelectValue placeholder="Select Device Group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filterOptions.device_groups.map((g: any) => (
                                                        <SelectItem key={g.id} value={g.id.toString()}>
                                                            {g.name} {g.queue_name && `(${g.queue_name})`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.device_group_id && (
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                        <span className="text-sm">
                                                            {filterOptions.device_groups.find((g: any) => g.id === form.device_group_id)?.name}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setForm(prev => ({
                                                                    ...prev,
                                                                    device_group_id: null
                                                                }));
                                                            }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="destination_address">Destination Address Pattern</Label>
                                        <Input 
                                            id="destination_address" 
                                            name="destination_address" 
                                            placeholder="* (tüm adresler), +90* (90 ile başlayan), *123 (123 ile biten)" 
                                            value={form.destination_address} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                        <div className="text-sm text-muted-foreground mt-1">
                                            <strong>Örnekler:</strong><br/>
                                            • <code>*</code> - Tüm telefon numaraları<br/>
                                            • <code>+90*</code> - 90 ile başlayan numaralar<br/>
                                            • <code>*123</code> - 123 ile biten numaralar<br/>
                                            • <code>+905551234567</code> - Belirli numara
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
                                                <SelectItem value="round_robin">Round Robin - Sırayla cihaz seç</SelectItem>
                                                <SelectItem value="least_used">Least Used - En az kullanılan cihazı seç</SelectItem>
                                                <SelectItem value="random">Random - Rastgele cihaz seç</SelectItem>
                                                <SelectItem value="specific">Specific - Belirli cihazları seç</SelectItem>
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
                                                Belirli cihazların IMEI'lerini virgülle ayırarak girin
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
                                            Bir mesaj için kaç cihaz kullanılacak (genellikle 1)
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
                                                <SelectItem value="1">SIM 1 - Birinci SIM kartı tercih et</SelectItem>
                                                <SelectItem value="2">SIM 2 - İkinci SIM kartı tercih et</SelectItem>
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
                                                <SelectItem value="preferred">Preferred - Tercih edilen SIM slot'u kullan</SelectItem>
                                                <SelectItem value="round_robin">Round Robin - SIM slot'ları sırayla kullan</SelectItem>
                                                <SelectItem value="least_used">Least Used - En az kullanılan SIM slot'u kullan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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