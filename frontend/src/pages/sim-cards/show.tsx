import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Smartphone, Signal, Wifi, Globe, CreditCard, Settings, Edit } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'SIM Cards',
        href: '/sim-cards',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface SimCardItem {
    id: number;
    slot_index: number;
    subscription_id: number;
    display_name: string;
    carrier_name: string;
    country_iso: string;
    number: string;
    imei: string;
    iccid: string;
    imsi: string;
    network_mcc: string;
    network_mnc: string;
    sim_mcc: string;
    sim_mnc: string;
    network_operator_name: string;
    sim_operator_name: string;
    roaming: boolean;
    signal_strength: number;
    signal_dbm: number;
    signal_type: string;
    rsrp: number;
    rsrq: number;
    rssnr: number;
    cqi: number;
    network_type: string;
    is_active: boolean;
    total_delivered: number;
    total_sent: number;
    total_waiting: number;
    main_balance: number;
    sms_balance: number;
    sms_limit: number;
    device_id: number;
    device_name: string;
    sitename: string;
    device_group_name: string;
    created_at: string;
    updated_at: string;
    status_badge_variant: string;
    roaming_badge_variant: string;
    signal_strength_badge_variant: string;
    network_type_badge_variant: string;
    success_rate: number;
    formatted_main_balance: string;
    formatted_sms_balance: string;
    formatted_sms_limit: string;
    signal_strength_text: string;
}

interface Props {
    simCard: SimCardItem;
}

export default function SimCardShow({ simCard }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`SIM Card - ${simCard.display_name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sim-cards">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">SIM Card Details</h1>
                            <p className="text-muted-foreground">
                                {simCard.display_name} - Slot {simCard.slot_index}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={simCard.status_badge_variant}>
                            {simCard.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {simCard.roaming && (
                            <Badge variant={simCard.roaming_badge_variant}>
                                Roaming
                            </Badge>
                        )}
                        <Link href={`/sim-cards/${simCard.id}/edit`}>
                            <Button size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Slot Index</label>
                                    <p className="text-sm">Slot {simCard.slot_index}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Subscription ID</label>
                                    <p className="text-sm">{simCard.subscription_id || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                                <p className="text-sm font-medium">{simCard.display_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Carrier Name</label>
                                    <p className="text-sm">{simCard.carrier_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                                    <p className="text-sm">{simCard.country_iso}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                                <p className="text-sm">{simCard.number}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wifi className="h-5 w-5" />
                                Device Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                                <p className="text-lg font-semibold">{simCard.device_name || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                                <p className="text-lg font-semibold">{simCard.device_id || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Sitename</label>
                                <p className="text-lg font-semibold">{simCard.sitename || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                                <p className="text-lg font-semibold">{simCard.device_group_name || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Technical Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">IMEI</label>
                                <p className="text-sm font-mono">{simCard.imei}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">ICCID</label>
                                <p className="text-sm font-mono">{simCard.iccid}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">IMSI</label>
                                <p className="text-sm font-mono">{simCard.imsi}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Network MCC</label>
                                    <p className="text-sm">{simCard.network_mcc}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Network MNC</label>
                                    <p className="text-sm">{simCard.network_mnc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Network Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wifi className="h-5 w-5" />
                                Network Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM MCC</label>
                                    <p className="text-sm">{simCard.sim_mcc}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM MNC</label>
                                    <p className="text-sm">{simCard.sim_mnc}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Network Operator</label>
                                <p className="text-sm">{simCard.network_operator_name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">SIM Operator</label>
                                <p className="text-sm">{simCard.sim_operator_name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Network Type</label>
                                <div className="mt-1">
                                    <Badge variant={simCard.network_type_badge_variant}>
                                        {simCard.network_type}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={simCard.roaming}
                                        readOnly
                                        className="rounded"
                                    />
                                    <label className="text-sm">Roaming</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={simCard.is_active}
                                        readOnly
                                        className="rounded"
                                    />
                                    <label className="text-sm">Active</label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Signal className="h-5 w-5" />
                                Signal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Signal Strength</label>
                                    <div className="mt-1">
                                        <Badge variant={simCard.signal_strength_badge_variant}>
                                            {simCard.signal_strength_text}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Signal dBm</label>
                                    <p className="text-sm">{simCard.signal_dbm} dBm</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Signal Type</label>
                                <p className="text-sm">{simCard.signal_type}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">RSRP</label>
                                    <p className="text-sm">{simCard.rsrp} dBm</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">RSRQ</label>
                                    <p className="text-sm">{simCard.rsrq} dB</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">RSSNR</label>
                                    <p className="text-sm">{simCard.rssnr} dB</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">CQI</label>
                                    <p className="text-sm">{simCard.cqi}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Balance Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Balance Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Main Balance</label>
                                <p className="text-lg font-semibold">₺{simCard.formatted_main_balance}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SMS Balance</label>
                                    <p className="text-sm">{simCard.formatted_sms_balance}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SMS Limit</label>
                                    <p className="text-sm">{simCard.formatted_sms_limit}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SMS Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                SMS Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-green-700">Delivered</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{simCard.total_delivered.toLocaleString()}</p>
                                    <p className="text-xs text-green-600 mt-1">
                                        {simCard.total_sent > 0 ? Math.round((simCard.total_delivered / simCard.total_sent) * 100) : 0}% of total sent
                                    </p>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-blue-700">Sent</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{simCard.total_sent.toLocaleString()}</p>
                                    <p className="text-xs text-blue-600 mt-1">Total messages sent</p>
                                </div>
                                
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-yellow-700">Waiting</span>
                                    </div>
                                    <p className="text-2xl font-bold text-yellow-600">{simCard.total_waiting.toLocaleString()}</p>
                                    <p className="text-xs text-yellow-600 mt-1">Pending delivery</p>
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Success Rate</span>
                                    <span className="text-lg font-bold text-gray-900">{simCard.success_rate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${Math.min(simCard.success_rate, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Additional Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Failed Messages</label>
                                    <p className="text-lg font-semibold text-red-600">
                                        {Math.max(0, simCard.total_sent - simCard.total_delivered - simCard.total_waiting)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Delivery Rate</label>
                                    <p className="text-lg font-semibold">
                                        {simCard.total_sent > 0 ? Math.round((simCard.total_delivered / simCard.total_sent) * 100) : 0}%
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