import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Phone, MessageSquare, Hash, Calendar, DollarSign, Settings, CheckCircle, XCircle } from 'lucide-react';

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

interface UssdLogItem {
    id: number;
    session_id: string;
    device_id: string;
    ussd_code: string;
    request_message: string | null;
    response_message: string | null;
    status: string;
    sent_at: string | null;
    received_at: string | null;
    error_message: string | null;
    metadata: any;
    device_group_id: number | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    ussdLog: UssdLogItem;
}

export default function UssdLogShow({ ussdLog }: Props) {
    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
                return 'default';
            case 'failed':
                return 'destructive';
            case 'pending':
                return 'secondary';
            case 'timeout':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`USSD Log - ${ussdLog.session_id}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/ussd-logs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">USSD Log Details</h1>
                            <p className="text-muted-foreground">
                                Session ID: {ussdLog.session_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon(ussdLog.status)}
                        <Badge variant={getStatusBadgeVariant(ussdLog.status)}>
                            {ussdLog.status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* USSD Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                USSD Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Session ID</label>
                                    <p className="text-sm font-mono">{ussdLog.session_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">USSD Code</label>
                                    <p className="text-sm font-mono">{ussdLog.ussd_code}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Request Message</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">{ussdLog.request_message || 'N/A'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Response Message</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">{ussdLog.response_message || 'N/A'}</p>
                                </div>
                            </div>

                            {ussdLog.error_message && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground text-red-600">Error Message</label>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-700 whitespace-pre-wrap">{ussdLog.error_message}</p>
                                    </div>
                                </div>
                            )}
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
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-mono">{ussdLog.device_id}</span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device Group ID</label>
                                <p className="text-sm">{ussdLog.device_group_id || 'N/A'}</p>
                            </div>

                            {ussdLog.metadata && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                        <pre className="text-xs overflow-auto">{JSON.stringify(ussdLog.metadata, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Status Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={getStatusBadgeVariant(ussdLog.status)}>
                                        {ussdLog.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sent At</label>
                                    <p className="text-sm">
                                        {ussdLog.sent_at ? new Date(ussdLog.sent_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Received At</label>
                                    <p className="text-sm">
                                        {ussdLog.received_at ? new Date(ussdLog.received_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
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
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                    <p className="text-sm">{new Date(ussdLog.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                    <p className="text-sm">
                                        {ussdLog.updated_at ? new Date(ussdLog.updated_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 