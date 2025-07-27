import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { mccMncService, type MccMncCreateRequest } from '@/services/mcc-mnc';
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
        title: 'Create',
        href: '/mcc-mnc/create',
    },
];

export default function MccMncCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<MccMncCreateRequest>({
        mcc: '',
        mnc: '',
        iso: '',
        country: '',
        country_code: '',
        network: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            await mccMncService.create(formData);
            toast.success('MCC-MNC record created successfully');
            navigate('/mcc-mnc');
        } catch (error) {
            console.error('Error creating MCC-MNC record:', error);
            toast.error('Failed to create MCC-MNC record');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof MccMncCreateRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create MCC-MNC Record</h1>
                        <p className="text-muted-foreground">
                            Add a new Mobile Country Code and Mobile Network Code record
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/mcc-mnc')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
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
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create MCC-MNC Record'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => navigate('/mcc-mnc')}
                                    disabled={loading}
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
