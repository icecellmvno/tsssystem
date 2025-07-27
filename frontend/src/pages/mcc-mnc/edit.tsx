import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { mccMncService, type MccMnc, type MccMncUpdateRequest } from '@/services/mcc-mnc';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'MCC-MNC',
        href: '/mcc-mnc',
    },
    {
        title: 'Edit',
        href: '/mcc-mnc/:id/edit',
    },
];

export default function MccMncEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<MccMncUpdateRequest>({
        mcc: '',
        mnc: '',
        iso: '',
        country: '',
        country_code: '',
        network: '',
    });

    useEffect(() => {
        const fetchMccMnc = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const data = await mccMncService.getById(parseInt(id));
                setFormData({
                    mcc: data.mcc,
                    mnc: data.mnc,
                    iso: data.iso,
                    country: data.country,
                    country_code: data.country_code,
                    network: data.network,
                });
            } catch (error) {
                console.error('Error fetching MCC-MNC record:', error);
                toast.error('Failed to fetch MCC-MNC record');
                navigate('/mcc-mnc');
            } finally {
                setLoading(false);
            }
        };

        fetchMccMnc();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!id) return;

        try {
            setSaving(true);
            await mccMncService.update(parseInt(id), formData);
            toast.success('MCC-MNC record updated successfully');
            navigate(`/mcc-mnc/${id}`);
        } catch (error) {
            console.error('Error updating MCC-MNC record:', error);
            toast.error('Failed to update MCC-MNC record');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof MccMncUpdateRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit MCC-MNC Record</h1>
                        <p className="text-muted-foreground">
                            Update Mobile Country Code and Mobile Network Code record
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate(`/mcc-mnc/${id}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Details
                    </Button>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>MCC-MNC Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="mcc">MCC (Mobile Country Code)</Label>
                                    <Input
                                        id="mcc"
                                        placeholder="e.g., 234"
                                        value={formData.mcc}
                                        onChange={(e) => handleInputChange('mcc', e.target.value)}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mnc">MNC (Mobile Network Code)</Label>
                                    <Input
                                        id="mnc"
                                        placeholder="e.g., 15"
                                        value={formData.mnc}
                                        onChange={(e) => handleInputChange('mnc', e.target.value)}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="iso">ISO Code</Label>
                                    <Input
                                        id="iso"
                                        placeholder="e.g., gb"
                                        value={formData.iso}
                                        onChange={(e) => handleInputChange('iso', e.target.value)}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country_code">Country Code</Label>
                                    <Input
                                        id="country_code"
                                        placeholder="e.g., 44"
                                        value={formData.country_code}
                                        onChange={(e) => handleInputChange('country_code', e.target.value)}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="country">Country Name</Label>
                                    <Input
                                        id="country"
                                        placeholder="e.g., United Kingdom"
                                        value={formData.country}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                        required
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="network">Network Name</Label>
                                    <Input
                                        id="network"
                                        placeholder="e.g., Vodafone"
                                        value={formData.network}
                                        onChange={(e) => handleInputChange('network', e.target.value)}
                                        required
                                        maxLength={200}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update MCC-MNC Record'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => navigate(`/mcc-mnc/${id}`)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
