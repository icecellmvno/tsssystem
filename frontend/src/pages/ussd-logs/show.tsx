
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, MessageSquare, Phone, Hash, Calendar, AlertTriangle } from 'lucide-react';
import { ussdLogsService, type UssdLog } from '@/services/ussd-logs';
import { toast } from 'sonner';

export default function UssdLogsShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ussdLog, setUssdLog] = useState<UssdLog | null>(null);
    const [loading, setLoading] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'USSD Logs',
            href: '/ussd-logs',
        },
        {
            title: 'Details',
            href: '#',
        },
    ];

    useEffect(() => {
        const fetchUssdLog = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const data = await ussdLogsService.getUssdLog(parseInt(id));
                setUssdLog(data);
            } catch (error) {
                console.error('Error fetching USSD log:', error);
                toast.error('Failed to fetch USSD log details');
                navigate('/ussd-logs');
            } finally {
                setLoading(false);
            }
        };

        fetchUssdLog();
    }, [id, navigate]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'failed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not available';
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading USSD log details...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!ussdLog) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">USSD log not found</p>
                        <Button onClick={() => navigate('/ussd-logs')} className="mt-4">
                            Back to USSD Logs
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/ussd-logs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to USSD Logs
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">USSD Log Details</h1>
                            <p className="text-muted-foreground">
                                Session ID: {ussdLog.session_id}
                            </p>
                        </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(ussdLog.status)} className="text-sm">
                        {ussdLog.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                                    <p className="text-sm">{ussdLog.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Session ID</label>
                                    <p className="text-sm font-mono">{ussdLog.session_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                                    <p className="text-sm">{ussdLog.device_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                                    <p className="text-sm">{ussdLog.device_name || 'Not available'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM Slot</label>
                                    <p className="text-sm">{ussdLog.sim_slot || 'Not available'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">USSD Code</label>
                                    <p className="text-sm font-mono">{ussdLog.ussd_code}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Device Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Device IMEI</label>
                                    <p className="text-sm font-mono">{ussdLog.device_imei || 'Not available'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Device IMSI</label>
                                    <p className="text-sm font-mono">{ussdLog.device_imsi || 'Not available'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                                    <p className="text-sm">{ussdLog.device_group || 'Not available'}</p>
                                </div>
                                <div>
                                                            <label className="text-sm font-medium text-muted-foreground">Country Site</label>
                        <p className="text-sm">{ussdLog.country_site || 'Not available'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Messages */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                USSD Messages
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Request Message</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                    <p className="text-sm font-mono whitespace-pre-wrap">
                                        {ussdLog.request_message || 'No request message'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Response Message</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                    <p className="text-sm font-mono whitespace-pre-wrap">
                                        {ussdLog.response_message || 'No response message'}
                                    </p>
                                </div>
                            </div>
                            {ussdLog.error_message && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                                    <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                        <p className="text-sm text-destructive">
                                            {ussdLog.error_message}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                    <p className="text-sm">{formatDate(ussdLog.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                    <p className="text-sm">{formatDate(ussdLog.updated_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sent At</label>
                                    <p className="text-sm">{formatDate(ussdLog.sent_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Received At</label>
                                    <p className="text-sm">{formatDate(ussdLog.received_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    {ussdLog.metadata && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Hash className="h-5 w-5" />
                                    Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 bg-muted rounded-md">
                                    <pre className="text-sm font-mono whitespace-pre-wrap">
                                        {JSON.stringify(ussdLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 
