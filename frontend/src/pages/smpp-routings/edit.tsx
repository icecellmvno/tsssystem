import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'SMPP Routings', href: '/smpp-routings' },
    { title: 'Edit', href: '#' },
];

export default function SmppRoutingEdit({ routing, deviceGroups = [], smppUsers = [], smppClients = [], users = [] }: any) {
    const [form, setForm] = useState({
        ...routing,
        target_queue_name: routing.target_queue_name ? String(routing.target_queue_name) : '',
        target_system_id: routing.target_system_id ? String(routing.target_system_id) : '',
        user_id: routing.user_id ? String(routing.user_id) : '',
    });
    const [errors, setErrors] = useState<any>({});

    const handleChange = (e: any) => {
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

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setErrors({});
        router.put(`/smpp-routings/${routing.id}`, form, {
            onError: (err) => setErrors(err),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit SMPP Routing" />
            <div className="max-w-2xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit SMPP Routing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" placeholder="Routing name" value={form.name} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" placeholder="Description" value={form.description} onChange={handleChange} />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="source_type">Source Type</Label>
                                    <Select value={form.source_type} onValueChange={(v) => handleSelect('source_type', v)}>
                                        <SelectTrigger id="source_type" className="w-full"><SelectValue placeholder="Source Type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="smpp">SMPP</SelectItem>
                                            <SelectItem value="http">HTTP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="direction">Direction</Label>
                                    <Select value={form.direction} onValueChange={(v) => handleSelect('direction', v)}>
                                        <SelectTrigger id="direction" className="w-full"><SelectValue placeholder="Direction" /></SelectTrigger>
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
                                        <SelectTrigger id="system_id" className="w-full"><SelectValue placeholder="Select System ID" /></SelectTrigger>
                                        <SelectContent>
                                            {smppUsers.map((systemId: string) => (
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
                                        <SelectTrigger id="user_id" className="w-full"><SelectValue placeholder="Select User" /></SelectTrigger>
                                        <SelectContent>
                                            {users.map((u: any) => (
                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="destination_address">Destination Address</Label>
                                <Input id="destination_address" name="destination_address" placeholder="Destination address pattern (required)" value={form.destination_address} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="target_type">Target Type</Label>
                                <Select value={form.target_type} onValueChange={(v) => handleSelect('target_type', v)}>
                                    <SelectTrigger id="target_type" className="w-full"><SelectValue placeholder="Target Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="http">HTTP</SelectItem>
                                        <SelectItem value="device_group">Device Group</SelectItem>
                                        <SelectItem value="smpp">SMPP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.target_type === 'http' && (
                                <div>
                                    <Label htmlFor="target_url">Target URL</Label>
                                    <Input id="target_url" name="target_url" placeholder="https://..." value={form.target_url} onChange={handleChange} required />
                                </div>
                            )}
                            {form.target_type === 'device_group' && (
                                <div>
                                    <Label htmlFor="target_queue_name">Device Group</Label>
                                    <Select value={form.target_queue_name} onValueChange={(v) => handleSelect('target_queue_name', v)}>
                                        <SelectTrigger id="target_queue_name" className="w-full"><SelectValue placeholder="Select Device Group" /></SelectTrigger>
                                        <SelectContent>
                                            {deviceGroups.map((g: any) => (
                                                <SelectItem key={g.id} value={g.queue_name || `group-${g.id}`}>
                                                    {g.name} {g.queue_name && `(${g.queue_name})`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {form.target_type === 'smpp' && (
                                <div>
                                    <Label htmlFor="target_system_id">Target System ID</Label>
                                    <Select value={form.target_system_id} onValueChange={(v) => handleSelect('target_system_id', v)}>
                                        <SelectTrigger id="target_system_id" className="w-full"><SelectValue placeholder="Select Target System ID" /></SelectTrigger>
                                        <SelectContent>
                                            {smppClients.map((cid: string) => (
                                                <SelectItem key={cid} value={cid}>{cid}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Input id="priority" name="priority" type="number" min={0} max={100} value={form.priority} onChange={handleChange} required />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                            {Object.keys(errors).length > 0 && (
                                <div className="text-destructive text-sm">
                                    {Object.values(errors).map((err: any, i) => (
                                        <div key={i}>{err}</div>
                                    ))}
                                </div>
                            )}
                            <Button type="submit" className="w-full">Update Routing</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 