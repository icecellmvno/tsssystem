import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Smartphone, Save } from 'lucide-react';
import { simCardsService, type SimCard, type UpdateSimCardData } from '@/services/sim-cards';
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
        title: 'Edit',
        href: '#',
    },
];

export default function SimCardEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<UpdateSimCardData>({
        slot_index: 1,
        subscription_id: 1,
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
        signal_strength: 0,
        signal_dbm: 0,
        signal_type: '',
        rsrp: 0,
        rsrq: 0,
        rssnr: 0,
        cqi: 0,
        network_type: '',
        is_active: true,
        total_delivered: 0,
        total_sent: 0,
        total_waiting: 0,
        main_balance: 0,
        sms_balance: 0,
        sms_limit: 0,
    });

    useEffect(() => {
        const fetchSimCard = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const response = await simCardsService.getSimCard(parseInt(id));
                const simCard = response.data;
                
                setFormData({
                    slot_index: simCard.slot_index,
                    subscription_id: simCard.subscription_id,
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
                    roaming: simCard.roaming,
                    signal_strength: simCard.signal_strength,
                    signal_dbm: simCard.signal_dbm,
                    signal_type: simCard.signal_type || '',
                    rsrp: simCard.rsrp,
                    rsrq: simCard.rsrq,
                    rssnr: simCard.rssnr,
                    cqi: simCard.cqi,
                    network_type: simCard.network_type || '',
                    is_active: simCard.is_active,
                    total_delivered: simCard.total_delivered,
                    total_sent: simCard.total_sent,
                    total_waiting: simCard.total_waiting,
                    main_balance: simCard.main_balance,
                    sms_balance: simCard.sms_balance,
                    sms_limit: simCard.sms_limit,
                });
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

    const handleInputChange = (field: keyof UpdateSimCardData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!id) return;
        
        try {
            setSaving(true);
            await simCardsService.updateSimCard(parseInt(id), formData);
            toast.success('SIM card updated successfully');
            navigate(`/sim-cards/${id}`);
        } catch (error) {
            console.error('Error updating SIM card:', error);
            toast.error('Failed to update SIM card');
        } finally {
            setSaving(false);
        }
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/sim-cards/${id}`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Details
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Edit SIM Card</h1>
                            <p className="text-muted-foreground">
                                Update SIM card information
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            SIM Card Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="slot_index">Slot Index *</Label>
                                    <Input
                                        id="slot_index"
                                        type="number"
                                        min="1"
                                        max="2"
                                        value={formData.slot_index}
                                        onChange={(e) => handleInputChange('slot_index', parseInt(e.target.value))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subscription_id">Subscription ID *</Label>
                                    <Input
                                        id="subscription_id"
                                        type="number"
                                        min="1"
                                        value={formData.subscription_id}
                                        onChange={(e) => handleInputChange('subscription_id', parseInt(e.target.value))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="display_name">Display Name</Label>
                                    <Input
                                        id="display_name"
                                        value={formData.display_name}
                                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                                        placeholder="e.g., Primary SIM"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="carrier_name">Carrier Name</Label>
                                    <Input
                                        id="carrier_name"
                                        value={formData.carrier_name}
                                        onChange={(e) => handleInputChange('carrier_name', e.target.value)}
                                        placeholder="e.g., AT&T, Verizon"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country_iso">Country ISO</Label>
                                    <Input
                                        id="country_iso"
                                        value={formData.country_iso}
                                        onChange={(e) => handleInputChange('country_iso', e.target.value)}
                                        placeholder="e.g., US, TR"
                                        maxLength={2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="number">Phone Number</Label>
                                    <Input
                                        id="number"
                                        value={formData.number}
                                        onChange={(e) => handleInputChange('number', e.target.value)}
                                        placeholder="e.g., +1234567890"
                                    />
                                </div>
                            </div>

                            {/* SIM Card Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="imei">IMEI</Label>
                                    <Input
                                        id="imei"
                                        value={formData.imei}
                                        onChange={(e) => handleInputChange('imei', e.target.value)}
                                        placeholder="15-digit IMEI"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="iccid">ICCID</Label>
                                    <Input
                                        id="iccid"
                                        value={formData.iccid}
                                        onChange={(e) => handleInputChange('iccid', e.target.value)}
                                        placeholder="19-20 digit ICCID"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="imsi">IMSI</Label>
                                    <Input
                                        id="imsi"
                                        value={formData.imsi}
                                        onChange={(e) => handleInputChange('imsi', e.target.value)}
                                        placeholder="15-digit IMSI"
                                    />
                                </div>
                            </div>

                            {/* Network Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="network_mcc">Network MCC</Label>
                                    <Input
                                        id="network_mcc"
                                        value={formData.network_mcc}
                                        onChange={(e) => handleInputChange('network_mcc', e.target.value)}
                                        placeholder="e.g., 310"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="network_mnc">Network MNC</Label>
                                    <Input
                                        id="network_mnc"
                                        value={formData.network_mnc}
                                        onChange={(e) => handleInputChange('network_mnc', e.target.value)}
                                        placeholder="e.g., 260"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sim_mcc">SIM MCC</Label>
                                    <Input
                                        id="sim_mcc"
                                        value={formData.sim_mcc}
                                        onChange={(e) => handleInputChange('sim_mcc', e.target.value)}
                                        placeholder="e.g., 310"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sim_mnc">SIM MNC</Label>
                                    <Input
                                        id="sim_mnc"
                                        value={formData.sim_mnc}
                                        onChange={(e) => handleInputChange('sim_mnc', e.target.value)}
                                        placeholder="e.g., 260"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="network_operator_name">Network Operator</Label>
                                    <Input
                                        id="network_operator_name"
                                        value={formData.network_operator_name}
                                        onChange={(e) => handleInputChange('network_operator_name', e.target.value)}
                                        placeholder="e.g., AT&T Mobility"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sim_operator_name">SIM Operator</Label>
                                    <Input
                                        id="sim_operator_name"
                                        value={formData.sim_operator_name}
                                        onChange={(e) => handleInputChange('sim_operator_name', e.target.value)}
                                        placeholder="e.g., AT&T"
                                    />
                                </div>
                            </div>

                            {/* Signal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signal_strength">Signal Strength</Label>
                                    <Input
                                        id="signal_strength"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.signal_strength}
                                        onChange={(e) => handleInputChange('signal_strength', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signal_dbm">Signal DBM</Label>
                                    <Input
                                        id="signal_dbm"
                                        type="number"
                                        value={formData.signal_dbm}
                                        onChange={(e) => handleInputChange('signal_dbm', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signal_type">Signal Type</Label>
                                    <Input
                                        id="signal_type"
                                        value={formData.signal_type}
                                        onChange={(e) => handleInputChange('signal_type', e.target.value)}
                                        placeholder="e.g., LTE, 5G"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rsrp">RSRP</Label>
                                    <Input
                                        id="rsrp"
                                        type="number"
                                        value={formData.rsrp}
                                        onChange={(e) => handleInputChange('rsrp', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rsrq">RSRQ</Label>
                                    <Input
                                        id="rsrq"
                                        type="number"
                                        value={formData.rsrq}
                                        onChange={(e) => handleInputChange('rsrq', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rssnr">RSSNR</Label>
                                    <Input
                                        id="rssnr"
                                        type="number"
                                        value={formData.rssnr}
                                        onChange={(e) => handleInputChange('rssnr', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cqi">CQI</Label>
                                    <Input
                                        id="cqi"
                                        type="number"
                                        value={formData.cqi}
                                        onChange={(e) => handleInputChange('cqi', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="network_type">Network Type</Label>
                                    <Input
                                        id="network_type"
                                        value={formData.network_type}
                                        onChange={(e) => handleInputChange('network_type', e.target.value)}
                                        placeholder="e.g., 4G, 5G"
                                    />
                                </div>
                            </div>

                            {/* Balance and Limits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="main_balance">Main Balance</Label>
                                    <Input
                                        id="main_balance"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.main_balance}
                                        onChange={(e) => handleInputChange('main_balance', parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sms_balance">SMS Balance</Label>
                                    <Input
                                        id="sms_balance"
                                        type="number"
                                        min="0"
                                        value={formData.sms_balance}
                                        onChange={(e) => handleInputChange('sms_balance', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sms_limit">SMS Limit</Label>
                                    <Input
                                        id="sms_limit"
                                        type="number"
                                        min="0"
                                        value={formData.sms_limit}
                                        onChange={(e) => handleInputChange('sms_limit', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Status and Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="roaming"
                                        checked={formData.roaming}
                                        onCheckedChange={(checked) => handleInputChange('roaming', checked)}
                                    />
                                    <Label htmlFor="roaming">Roaming</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4">
                                <Link to={`/sim-cards/${id}`}>
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Update SIM Card
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
