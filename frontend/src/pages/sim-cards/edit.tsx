import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Smartphone, Save } from 'lucide-react';

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
        title: 'Edit',
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
}

interface Props {
    simCard: SimCardItem;
}

export default function SimCardEdit({ simCard }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        slot_index: simCard.slot_index || '',
        subscription_id: simCard.subscription_id || '',
        display_name: simCard.display_name || '',
        carrier_name: simCard.carrier_name || '',
        country_iso: simCard.country_iso || '',
        number: simCard.number || '',
        imei: simCard.imei || '',
        iccid: simCard.iccid || '',
        imsi: simCard.imsi || '',
        network_mcc: simCard.network_mcc || '',
        network_mnc: simCard.network_mnc || '',
        sim_mcc: simCard.sim_mcc || '',
        sim_mnc: simCard.sim_mnc || '',
        network_operator_name: simCard.network_operator_name || '',
        sim_operator_name: simCard.sim_operator_name || '',
        roaming: simCard.roaming || false,
        signal_strength: simCard.signal_strength || '',
        signal_dbm: simCard.signal_dbm || '',
        signal_type: simCard.signal_type || '',
        rsrp: simCard.rsrp || '',
        rsrq: simCard.rsrq || '',
        rssnr: simCard.rssnr || '',
        cqi: simCard.cqi || '',
        network_type: simCard.network_type || '',
        is_active: simCard.is_active || true,
        total_delivered: simCard.total_delivered || 0,
        total_sent: simCard.total_sent || 0,
        total_waiting: simCard.total_waiting || 0,
        main_balance: simCard.main_balance || 0,
        sms_balance: simCard.sms_balance || 0,
        sms_limit: simCard.sms_limit || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/sim-cards/${simCard.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit SIM Card - ${simCard.display_name}`} />
            
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
                            <h1 className="text-3xl font-bold tracking-tight">Edit SIM Card</h1>
                            <p className="text-muted-foreground">
                                {simCard.display_name} - Slot {simCard.slot_index}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="slot_index">Slot Index</Label>
                                        <Input
                                            id="slot_index"
                                            type="number"
                                            value={data.slot_index}
                                            onChange={(e) => setData('slot_index', e.target.value)}
                                            placeholder="0"
                                        />
                                        {errors.slot_index && (
                                            <p className="text-sm text-destructive">{errors.slot_index}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subscription_id">Subscription ID</Label>
                                        <Input
                                            id="subscription_id"
                                            type="number"
                                            value={data.subscription_id}
                                            onChange={(e) => setData('subscription_id', e.target.value)}
                                            placeholder="0"
                                        />
                                        {errors.subscription_id && (
                                            <p className="text-sm text-destructive">{errors.subscription_id}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="display_name">Display Name</Label>
                                    <Input
                                        id="display_name"
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="SIM Card Display Name"
                                    />
                                    {errors.display_name && (
                                        <p className="text-sm text-destructive">{errors.display_name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="carrier_name">Carrier Name</Label>
                                        <Input
                                            id="carrier_name"
                                            value={data.carrier_name}
                                            onChange={(e) => setData('carrier_name', e.target.value)}
                                            placeholder="Carrier Name"
                                        />
                                        {errors.carrier_name && (
                                            <p className="text-sm text-destructive">{errors.carrier_name}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country_iso">Country ISO</Label>
                                        <Input
                                            id="country_iso"
                                            value={data.country_iso}
                                            onChange={(e) => setData('country_iso', e.target.value)}
                                            placeholder="TR"
                                        />
                                        {errors.country_iso && (
                                            <p className="text-sm text-destructive">{errors.country_iso}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="number">Phone Number</Label>
                                    <Input
                                        id="number"
                                        value={data.number}
                                        onChange={(e) => setData('number', e.target.value)}
                                        placeholder="+90 555 123 4567"
                                    />
                                    {errors.number && (
                                        <p className="text-sm text-destructive">{errors.number}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5" />
                                    Technical Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="imei">IMEI</Label>
                                    <Input
                                        id="imei"
                                        value={data.imei}
                                        onChange={(e) => setData('imei', e.target.value)}
                                        placeholder="123456789012345"
                                    />
                                    {errors.imei && (
                                        <p className="text-sm text-destructive">{errors.imei}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="iccid">ICCID</Label>
                                    <Input
                                        id="iccid"
                                        value={data.iccid}
                                        onChange={(e) => setData('iccid', e.target.value)}
                                        placeholder="8988247000000123456"
                                    />
                                    {errors.iccid && (
                                        <p className="text-sm text-destructive">{errors.iccid}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imsi">IMSI</Label>
                                    <Input
                                        id="imsi"
                                        value={data.imsi}
                                        onChange={(e) => setData('imsi', e.target.value)}
                                        placeholder="286012345678901"
                                    />
                                    {errors.imsi && (
                                        <p className="text-sm text-destructive">{errors.imsi}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="network_mcc">Network MCC</Label>
                                        <Input
                                            id="network_mcc"
                                            value={data.network_mcc}
                                            onChange={(e) => setData('network_mcc', e.target.value)}
                                            placeholder="286"
                                        />
                                        {errors.network_mcc && (
                                            <p className="text-sm text-destructive">{errors.network_mcc}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="network_mnc">Network MNC</Label>
                                        <Input
                                            id="network_mnc"
                                            value={data.network_mnc}
                                            onChange={(e) => setData('network_mnc', e.target.value)}
                                            placeholder="01"
                                        />
                                        {errors.network_mnc && (
                                            <p className="text-sm text-destructive">{errors.network_mnc}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Network Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5" />
                                    Network Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sim_mcc">SIM MCC</Label>
                                        <Input
                                            id="sim_mcc"
                                            value={data.sim_mcc}
                                            onChange={(e) => setData('sim_mcc', e.target.value)}
                                            placeholder="286"
                                        />
                                        {errors.sim_mcc && (
                                            <p className="text-sm text-destructive">{errors.sim_mcc}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sim_mnc">SIM MNC</Label>
                                        <Input
                                            id="sim_mnc"
                                            value={data.sim_mnc}
                                            onChange={(e) => setData('sim_mnc', e.target.value)}
                                            placeholder="01"
                                        />
                                        {errors.sim_mnc && (
                                            <p className="text-sm text-destructive">{errors.sim_mnc}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="network_operator_name">Network Operator</Label>
                                    <Input
                                        id="network_operator_name"
                                        value={data.network_operator_name}
                                        onChange={(e) => setData('network_operator_name', e.target.value)}
                                        placeholder="Network Operator Name"
                                    />
                                    {errors.network_operator_name && (
                                        <p className="text-sm text-destructive">{errors.network_operator_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sim_operator_name">SIM Operator</Label>
                                    <Input
                                        id="sim_operator_name"
                                        value={data.sim_operator_name}
                                        onChange={(e) => setData('sim_operator_name', e.target.value)}
                                        placeholder="SIM Operator Name"
                                    />
                                    {errors.sim_operator_name && (
                                        <p className="text-sm text-destructive">{errors.sim_operator_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="network_type">Network Type</Label>
                                    <Input
                                        id="network_type"
                                        value={data.network_type}
                                        onChange={(e) => setData('network_type', e.target.value)}
                                        placeholder="4G, 5G, etc."
                                    />
                                    {errors.network_type && (
                                        <p className="text-sm text-destructive">{errors.network_type}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="roaming"
                                        checked={data.roaming}
                                        onCheckedChange={(checked) => setData('roaming', checked as boolean)}
                                    />
                                    <Label htmlFor="roaming">Roaming</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Signal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5" />
                                    Signal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signal_strength">Signal Strength</Label>
                                        <Input
                                            id="signal_strength"
                                            type="number"
                                            value={data.signal_strength}
                                            onChange={(e) => setData('signal_strength', e.target.value)}
                                            placeholder="5"
                                        />
                                        {errors.signal_strength && (
                                            <p className="text-sm text-destructive">{errors.signal_strength}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signal_dbm">Signal dBm</Label>
                                        <Input
                                            id="signal_dbm"
                                            type="number"
                                            value={data.signal_dbm}
                                            onChange={(e) => setData('signal_dbm', e.target.value)}
                                            placeholder="-85"
                                        />
                                        {errors.signal_dbm && (
                                            <p className="text-sm text-destructive">{errors.signal_dbm}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signal_type">Signal Type</Label>
                                    <Input
                                        id="signal_type"
                                        value={data.signal_type}
                                        onChange={(e) => setData('signal_type', e.target.value)}
                                        placeholder="LTE, 5G, etc."
                                    />
                                    {errors.signal_type && (
                                        <p className="text-sm text-destructive">{errors.signal_type}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rsrp">RSRP</Label>
                                        <Input
                                            id="rsrp"
                                            type="number"
                                            value={data.rsrp}
                                            onChange={(e) => setData('rsrp', e.target.value)}
                                            placeholder="-120"
                                        />
                                        {errors.rsrp && (
                                            <p className="text-sm text-destructive">{errors.rsrp}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rsrq">RSRQ</Label>
                                        <Input
                                            id="rsrq"
                                            type="number"
                                            value={data.rsrq}
                                            onChange={(e) => setData('rsrq', e.target.value)}
                                            placeholder="-10"
                                        />
                                        {errors.rsrq && (
                                            <p className="text-sm text-destructive">{errors.rsrq}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rssnr">RSSNR</Label>
                                        <Input
                                            id="rssnr"
                                            type="number"
                                            value={data.rssnr}
                                            onChange={(e) => setData('rssnr', e.target.value)}
                                            placeholder="10"
                                        />
                                        {errors.rssnr && (
                                            <p className="text-sm text-destructive">{errors.rssnr}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cqi">CQI</Label>
                                        <Input
                                            id="cqi"
                                            type="number"
                                            value={data.cqi}
                                            onChange={(e) => setData('cqi', e.target.value)}
                                            placeholder="15"
                                        />
                                        {errors.cqi && (
                                            <p className="text-sm text-destructive">{errors.cqi}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Updating...' : 'Update SIM Card'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 