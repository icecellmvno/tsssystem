import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'SMPP Routings', href: '/smpp-routings' },
    { title: 'Show', href: '#' },
];

export default function SmppRoutingShow({ routing }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`SMPP Routing: ${routing.name}`} />
            <div className="max-w-2xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>SMPP Routing Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div><b>Name:</b> {routing.name}</div>
                            <div><b>Description:</b> {routing.description}</div>
                            <div><b>Source Type:</b> <Badge>{routing.source_type}</Badge></div>
                            <div><b>Direction:</b> <Badge>{routing.direction}</Badge></div>
                            <div><b>System ID:</b> {routing.system_id || <span className="text-muted-foreground">N/A</span>}</div>
                            <div><b>Destination Address:</b> {routing.destination_address || <span className="text-muted-foreground">N/A</span>}</div>
                            <div><b>Target Type:</b> <Badge>{routing.target_type}</Badge></div>
                            {routing.target_type === 'http' && (
                                <div><b>Target URL:</b> {routing.target_url}</div>
                            )}
                            {routing.target_type === 'device_group' && (
                                <div><b>Device Group:</b> {routing.device_group?.name || 'N/A'}</div>
                            )}
                            {routing.target_type === 'smpp' && (
                                <div><b>SMPP Target:</b> SMPP Target</div>
                            )}
                            <div><b>Priority:</b> {routing.priority}</div>
                            <div><b>Status:</b> <Badge variant={routing.status_badge_variant}>{routing.is_active ? 'Active' : 'Inactive'}</Badge></div>
                            <div><b>Created At:</b> {routing.created_at}</div>
                            <div><b>Updated At:</b> {routing.updated_at}</div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" onClick={() => router.get(`/smpp-routings/${routing.id}/edit`)}>Edit</Button>
                            <Button variant="outline" onClick={() => router.get('/smpp-routings')}>Back to List</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 