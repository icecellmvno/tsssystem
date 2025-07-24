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
        title: 'Create',
        href: '#',
    },
];

export default function SimCardCreate() {
    const { data, setData, post, processing, errors } = useForm({
        slot_index: '',
        subscription_id: '',
        display_name: '',
        carrier_name: '',
        country_iso: '',
        number: '',
        imei: '',
        iccid: '',
        imsi: '',
        network_mcc: '',
        network_mnc: '',
        sim_mcc: '',
        sim_mnc: '',
        network_operator_name: '',
        sim_operator_name: '',
        roaming: false,
        signal_strength: '',
        signal_dbm: '',
        signal_type: '',
        rsrp: '',
        rsrq: '',
        rssnr: '',
        cqi: '',
        network_type: '',
        is_active: true,
        total_delivered: 0,
        total_sent: 0,
        total_waiting: 0,
        main_balance: 0,
        sms_balance: 0,
        sms_limit: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sim-cards');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create SIM Card" />
            
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
                            <h1 className="text-3xl font-bold tracking-tight">Create SIM Card</h1>
                            <p className="text-muted-foreground">
                                Add a new SIM card to the system
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
                            {processing ? 'Creating...' : 'Create SIM Card'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 