import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { smppRoutingsService, type SmppRoutingItem } from '@/services/smpp-routings';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'SMPP Routings', href: '/smpp-routings' },
    { title: 'Show', href: '#' },
];

export default function SmppRoutingShow() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [routing, setRouting] = useState<SmppRoutingItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRouting = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);
                const routingData = await smppRoutingsService.getById(parseInt(id));
                setRouting(routingData);
            } catch (error) {
                console.error('Error fetching routing:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch routing');
                toast.error('Failed to fetch routing data');
            } finally {
                setLoading(false);
            }
        };

        fetchRouting();
    }, [id]);

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading routing...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !routing) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-destructive">Error loading routing: {error}</p>
                        <Button onClick={() => navigate('/smpp-routings')} className="mt-4">
                            Back to List
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-4xl mx-auto p-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{routing.name}</h1>
                        <p className="text-muted-foreground">{routing.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate(`/smpp-routings/${routing.id}/edit`)}
                        >
                            Edit
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => navigate('/smpp-routings')}
                        >
                            Back to List
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Status:</span>
                                <Badge variant={routing.status_badge_variant}>
                                    {routing.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Priority:</span>
                                <Badge variant="outline">{routing.priority}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Source Type:</span>
                                <Badge variant={routing.source_type_badge_variant}>
                                    {routing.source_type.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Direction:</span>
                                <Badge variant={routing.direction_badge_variant}>
                                    {routing.direction}
                                </Badge>
                            </div>
                            {routing.system_id && (
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">System ID:</span>
                                    <span className="text-sm">{routing.system_id}</span>
                                </div>
                            )}
                            {routing.destination_address && (
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Destination Pattern:</span>
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                        {routing.destination_address}
                                    </code>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Target Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Target Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Target Type:</span>
                                <Badge variant={routing.target_type_badge_variant}>
                                    {routing.target_type.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Device Groups:</span>
                                <span className="text-sm">{routing.target_display_name}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device Selection Strategy */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Device Selection Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Strategy:</span>
                                <Badge variant="outline">
                                    {routing.device_selection_strategy || 'round_robin'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Max Devices Per Message:</span>
                                <span className="text-sm">{routing.max_devices_per_message || 1}</span>
                            </div>
                            {routing.target_device_ids && (
                                <div>
                                    <span className="font-medium">Target Devices:</span>
                                    <div className="mt-2">
                                        {JSON.parse(routing.target_device_ids).map((imei: string, index: number) => (
                                            <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                                {imei}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SIM Card Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>SIM Card Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">SIM Slot Preference:</span>
                                <Badge variant="outline">
                                    SIM {routing.sim_slot_preference || 1}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">SIM Selection Strategy:</span>
                                <Badge variant="outline">
                                    {routing.sim_card_selection_strategy || 'preferred'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Timestamps</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Created At:</span>
                                    <span className="text-sm">{new Date(routing.created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Updated At:</span>
                                    <span className="text-sm">{new Date(routing.updated_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 