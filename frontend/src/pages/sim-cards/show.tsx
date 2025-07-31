
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Smartphone, Signal, Wifi, Globe, CreditCard, Settings, Edit } from 'lucide-react';
import { simCardsService, type SimCard } from '@/services/sim-cards';
import { toast } from 'sonner';

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

export default function SimCardShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [simCard, setSimCard] = useState<SimCard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimCard = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const response = await simCardsService.getSimCard(parseInt(id));
                setSimCard(response);
            } catch (error) {
                console.error('Error fetching SIM card:', error);
                toast.error('Failed to fetch SIM card details');
                navigate('/sim-cards');
            } finally {
                setLoading(false);
            }
        };

        fetchSimCard();
    }, [id, navigate]);

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading SIM card details...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!simCard) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-muted-foreground">SIM card not found</p>
                        <Link to="/sim-cards">
                            <Button className="mt-4">Back to SIM Cards</Button>
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const getStatusBadgeVariant = (isActive: boolean) => {
        return isActive ? 'default' : 'destructive';
    };

    const getRoamingBadgeVariant = (roaming: boolean) => {
        return roaming ? 'destructive' : 'default';
    };

    const getNetworkTypeBadgeVariant = (networkType: string) => {
        switch (networkType) {
            case '5G':
                return 'default';
            case '4G':
                return 'outline';
            case '3G':
                return 'secondary';
            case '2G':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getSignalStrengthBadgeVariant = (signalStrength: number) => {
        if (signalStrength >= 75) return 'default';
        if (signalStrength >= 50) return 'outline';
        return 'destructive';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/sim-cards">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to SIM Cards
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">SIM Card Details</h1>
                            <p className="text-muted-foreground">
                                {simCard.display_name} - Slot {simCard.slot_index}
                            </p>
                        </div>
                    </div>
                    <Link to={`/sim-cards/${simCard.id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit SIM Card
                        </Button>
                    </Link>
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
                                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                                    <p className="text-sm">{simCard.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Slot Index</label>
                                    <p className="text-sm">Slot {simCard.slot_index}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Subscription ID</label>
                                    <p className="text-sm">{simCard.subscription_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                                    <p className="text-sm">{simCard.display_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Carrier</label>
                                    <p className="text-sm">{simCard.carrier_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                                    <p className="text-sm">{simCard.country_iso || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                                    <p className="text-sm font-mono">{simCard.number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <Badge variant={getStatusBadgeVariant(simCard.is_active)}>
                                        {simCard.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
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
                                    <label className="text-sm font-medium text-muted-foreground">Network Type</label>
                                    <Badge variant={getNetworkTypeBadgeVariant(simCard.network_type)}>
                                        {simCard.network_type || 'N/A'}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Roaming</label>
                                    <Badge variant={getRoamingBadgeVariant(simCard.roaming)}>
                                        {simCard.roaming ? 'Roaming' : 'Local'}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Network Operator</label>
                                    <p className="text-sm">{simCard.network_operator_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM Operator</label>
                                    <p className="text-sm">{simCard.sim_operator_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Network MCC</label>
                                    <p className="text-sm">{simCard.network_mcc || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Network MNC</label>
                                    <p className="text-sm">{simCard.network_mnc || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Technical Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">IMEI</label>
                                    <p className="text-sm font-mono">{simCard.imei || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ICCID</label>
                                    <p className="text-sm font-mono">{simCard.iccid || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">IMSI</label>
                                    <p className="text-sm font-mono">{simCard.imsi || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM MCC</label>
                                    <p className="text-sm">{simCard.sim_mcc || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SIM MNC</label>
                                    <p className="text-sm">{simCard.sim_mnc || 'N/A'}</p>
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
                                    <Badge variant={getSignalStrengthBadgeVariant(simCard.signal_strength)}>
                                        {simCard.signal_strength}%
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Signal DBM</label>
                                    <p className="text-sm">{simCard.signal_dbm} dBm</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Signal Type</label>
                                    <p className="text-sm">{simCard.signal_type || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">RSRP</label>
                                    <p className="text-sm">{simCard.rsrp} dBm</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">RSRQ</label>
                                    <p className="text-sm">{simCard.rsrq} dB</p>
                                </div>
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

                    {/* Balance and Limits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Balance and Limits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Main Balance</label>
                                    <p className="text-sm font-medium">{simCard.formatted_main_balance}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SMS Balance</label>
                                    <p className="text-sm">{simCard.formatted_sms_balance} SMS</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SMS Limit</label>
                                    <p className="text-sm">{simCard.formatted_sms_limit} SMS</p>
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
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Total Sent</label>
                                    <p className="text-sm font-medium">{simCard.total_sent.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Total Delivered</label>
                                    <p className="text-sm font-medium text-green-600">{simCard.total_delivered.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Total Waiting</label>
                                    <p className="text-sm font-medium text-yellow-600">{simCard.total_waiting.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Success Rate</label>
                                    <p className="text-sm font-medium">{simCard.success_rate.toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Device Information */}
                                    {(simCard.device_name || simCard.country_site || simCard.device_group_name) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Device Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {simCard.device_name && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                                        <p className="text-sm">{simCard.device_name}</p>
                                    </div>
                                )}
                                                    {simCard.country_site && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Country Site</label>
                            <p className="text-sm">{simCard.country_site}</p>
                        </div>
                    )}
                                {simCard.device_group_name && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                                        <p className="text-sm">{simCard.device_group_name}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Timestamps */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <p className="text-sm">{formatDate(simCard.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                <p className="text-sm">{formatDate(simCard.updated_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
