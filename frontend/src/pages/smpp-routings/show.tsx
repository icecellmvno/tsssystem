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
            <div className="max-w-2xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>SMPP Routing Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div><b>Name:</b> {routing.name}</div>
                            <div><b>Description:</b> {routing.description}</div>
                            <div><b>Source Type:</b> <Badge variant={routing.source_type_badge_variant}>{routing.source_type}</Badge></div>
                            <div><b>Direction:</b> <Badge variant={routing.direction_badge_variant}>{routing.direction}</Badge></div>
                            <div><b>System ID:</b> {routing.system_id || <span className="text-muted-foreground">N/A</span>}</div>
                            <div><b>Destination Address:</b> {routing.destination_address || <span className="text-muted-foreground">N/A</span>}</div>
                            <div><b>Target Type:</b> <Badge variant={routing.target_type_badge_variant}>{routing.target_type}</Badge></div>
                            {routing.target_type === 'http' && (
                                <div><b>Target URL:</b> {routing.target_url}</div>
                            )}
                            {routing.target_type === 'device_group' && (
                                <div><b>Device Group:</b> {routing.device_group?.name || 'N/A'}</div>
                            )}
                            {routing.target_type === 'smpp' && (
                                <div><b>SMPP Target:</b> {routing.target_system_id || 'N/A'}</div>
                            )}
                            <div><b>Priority:</b> {routing.priority}</div>
                            <div><b>Status:</b> <Badge variant={routing.status_badge_variant}>{routing.is_active ? 'Active' : 'Inactive'}</Badge></div>
                            <div><b>Created At:</b> {routing.created_at}</div>
                            <div><b>Updated At:</b> {routing.updated_at}</div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" onClick={() => navigate(`/smpp-routings/${routing.id}/edit`)}>
                                Edit
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/smpp-routings')}>
                                Back to List
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 