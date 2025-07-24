import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { useWebSocket } from '@/contexts/websocket-context';
import { 
    Database, 
    Globe, 
    BarChart3, 
    Building2, 
    MessageSquare, 
    Smartphone, 
    AlertTriangle, 
    CreditCard, 
    Users, 
    Wifi, 
    Route, 
    Server, 
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    Signal
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Props {
    stats?: {
        mccMnc: { total: number; change: string; trend: string };
        sitenames: { total: number; change: string; trend: string };
        smsLogs: { total: number; change: string; trend: string };
        ussdLogs: { total: number; change: string; trend: string };
        alarmLogs: { total: number; change: string; trend: string };
        simCards: { total: number; change: string; trend: string };
        simCardSmsStats: { total_sent: number; total_delivered: number; total_waiting: number; success_rate: number };
        deviceGroups: { total: number; change: string; trend: string };
        devices: { total: number; change: string; trend: string };
        smppUsers: { total: number; change: string; trend: string };
        smppRoutings: { total: number; change: string; trend: string };
        scheduleTasks: { total: number; change: string; trend: string };
    };
    recentAlarms?: Array<{
        id: number;
        alarm_type: string;
        device_id: string;
        device_group_name: string;
        device_sitename: string;
        details: string;
        alarm_start: string;
        alarm_stop: string | null;
        status: string;
        formatted_start: string;
        formatted_duration: string;
    }>;
    systemHealth?: {
        devices: { online: number; total: number; percentage: number };
        sms: { delivered: number; sent: number; percentage: number };
        ussd: { success: number; total: number; percentage: number };
    };
}

export default function Dashboard({ stats, recentAlarms, systemHealth }: Props = {}) {
    const { isConnected, isConnecting, error } = useWebSocket();

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getSystemStatus = () => {
        if (isConnecting) {
            return {
                text: 'Connecting...',
                variant: 'secondary' as const,
                icon: <Activity className="h-3 w-3 animate-spin" />
            };
        }
        
        if (isConnected) {
            return {
                text: 'System Online',
                variant: 'outline' as const,
                icon: <Signal className="h-3 w-3 text-green-500" />
            };
        }
        
        return {
            text: 'System Offline',
            variant: 'destructive' as const,
            icon: <Signal className="h-3 w-3 text-red-500" />
        };
    };

    const systemStatus = getSystemStatus();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's what's happening with your system.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={systemStatus.variant} className="flex items-center gap-1">
                            {systemStatus.icon}
                            {systemStatus.text}
                        </Badge>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="space-y-6">

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.devices?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.devices?.change || '0%'} from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.smsLogs?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.smsLogs?.change || '0%'} from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">USSD Requests</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.ussdLogs?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.ussdLogs?.change || '0%'} from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.alarmLogs?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.alarmLogs?.change || '0%'} from last month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* System Health */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wifi className="h-4 w-4" />
                                Device Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Online Devices</span>
                                    <span className="text-sm font-medium">
                                        {systemHealth?.devices?.online || 0} / {systemHealth?.devices?.total || 0}
                                    </span>
                                </div>
                                <Progress value={systemHealth?.devices?.percentage || 0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                SMS Delivery
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Success Rate</span>
                                    <span className="text-sm font-medium">
                                        {systemHealth?.sms?.delivered || 0} / {systemHealth?.sms?.sent || 0}
                                    </span>
                                </div>
                                <Progress value={systemHealth?.sms?.percentage || 0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                USSD Success
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Success Rate</span>
                                    <span className="text-sm font-medium">
                                        {systemHealth?.ussd?.success || 0} / {systemHealth?.ussd?.total || 0}
                                    </span>
                                </div>
                                <Progress value={systemHealth?.ussd?.percentage || 0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Alarms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Recent Alarms
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentAlarms && recentAlarms.length > 0 ? (
                            <div className="space-y-4">
                                {recentAlarms.slice(0, 5).map((alarm) => (
                                    <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                alarm.status === 'active' ? 'bg-red-500' : 'bg-green-500'
                                            }`} />
                                            <div>
                                                <p className="font-medium">{alarm.alarm_type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {alarm.device_sitename} - {alarm.device_group_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{alarm.formatted_start}</p>
                                            <p className="text-xs text-muted-foreground">{alarm.formatted_duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No recent alarms</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
