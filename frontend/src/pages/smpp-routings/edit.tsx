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

                // Set form data
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
            <div className="max-w-2xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit SMPP Routing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                <Label htmlFor="description">Description</Label>
                                <Input 
                                    id="description" 
                                    name="description" 
                                    placeholder="Description" 
                                    value={form.description} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
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
                                <div className="flex-1">
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
                                <Label htmlFor="destination_address">Destination Address</Label>
                                <Input 
                                    id="destination_address" 
                                    name="destination_address" 
                                    placeholder="Destination address pattern (required)" 
                                    value={form.destination_address} 
                                    onChange={handleChange} 
                                    required 
                                />
                                {errors.destination_address && <p className="text-sm text-destructive mt-1">{errors.destination_address}</p>}
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
                            <div className="flex items-center gap-2">
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