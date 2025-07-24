import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, AlertTriangle, Smartphone, Calendar, Clock, Settings, CheckCircle, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Alarm Logs',
        href: '/alarm-logs',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface AlarmLogItem {
    id: number;
    alarm_type: string;
    device_id: string;
    device_group_name: string;
    device_sitename: string;
    sim_slot: number;
    details: string;
    alarm_start: string;
    alarm_stop: number;
    created_at: string;
    updated_at: string;
    alarm_status: string;
    alarm_status_badge_variant: string;
    alarm_type_badge_variant: string;
    formatted_alarm_stop: string;
    formatted_duration: string;
}

interface Props {
    alarmLog: AlarmLogItem;
}

export default function AlarmLogShow({ alarmLog }: Props) {
    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'active':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Alarm Log - ${alarmLog.device_id}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/alarm-logs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Alarm Log Details</h1>
                            <p className="text-muted-foreground">
                                Device ID: {alarmLog.device_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon(alarmLog.alarm_status)}
                        <Badge variant={alarmLog.alarm_status_badge_variant}>
                            {alarmLog.alarm_status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alarm Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Alarm Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Alarm Type</label>
                                    <div className="mt-1">
                                        <Badge variant={alarmLog.alarm_type_badge_variant}>
                                            {alarmLog.alarm_type}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM Slot</label>
                                    <p className="text-sm">Slot {alarmLog.sim_slot}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Details</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">{alarmLog.details}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                                    <p className="text-sm">{alarmLog.formatted_duration}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Stop Time</label>
                                    <p className="text-sm">{alarmLog.formatted_alarm_stop}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Device Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-mono">{alarmLog.device_id}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                                <p className="text-sm">{alarmLog.device_group_name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device Sitename</label>
                                <p className="text-sm">{alarmLog.device_sitename}</p>
                            </div>

                            <Separator />

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">SIM Slot</label>
                                <p className="text-sm">Slot {alarmLog.sim_slot}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timing Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Timing Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Alarm Start</label>
                                <p className="text-sm">{new Date(alarmLog.alarm_start).toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Alarm Stop</label>
                                <p className="text-sm">{alarmLog.formatted_alarm_stop}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Duration</label>
                                <p className="text-lg font-semibold">{alarmLog.formatted_duration}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={alarmLog.alarm_status_badge_variant}>
                                        {alarmLog.alarm_status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                System Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                    <p className="text-sm">{new Date(alarmLog.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                    <p className="text-sm">{new Date(alarmLog.updated_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Record ID</label>
                                <p className="text-sm font-mono">{alarmLog.id}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 