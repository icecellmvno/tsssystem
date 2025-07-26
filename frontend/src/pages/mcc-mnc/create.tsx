import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'MCC-MNC List',
        href: '/mcc-mnc',
    },
    {
        title: 'Create',
        href: '/mcc-mnc/create',
    },
];

export default function MccMncCreate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: '',
        country_name: '',
        country_code: '',
        mcc: '',
        mnc: '',
        brand: '',
        operator: '',
        status: '',
        bands: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // TODO: Implement API call
        console.log('Form submitted:', formData);
        navigate('/mcc-mnc');
    };

    const statusOptions = [
        'Operational',
        'Not operational',
        'Unknown',
        'Reserved',
    ];

    const typeOptions = [
        'National',
        'International',
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/mcc-mnc')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create MCC-MNC</h1>
                        <p className="text-muted-foreground">
                            Add a new MCC-MNC record
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>MCC-MNC Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* MCC */}
                                <div className="space-y-2">
                                    <Label htmlFor="mcc">MCC *</Label>
                                    <Input
                                        id="mcc"
                                        value={formData.mcc}
                                        onChange={(e) => handleChange('mcc', e.target.value)}
                                        placeholder="e.g., 232"
                                        maxLength={10}
                                    />
                                    {errors.mcc && (
                                        <p className="text-sm text-destructive">{errors.mcc}</p>
                                    )}
                                </div>

                                {/* MNC */}
                                <div className="space-y-2">
                                    <Label htmlFor="mnc">MNC *</Label>
                                    <Input
                                        id="mnc"
                                        value={formData.mnc}
                                        onChange={(e) => handleChange('mnc', e.target.value)}
                                        placeholder="e.g., 01"
                                        maxLength={10}
                                    />
                                    {errors.mnc && (
                                        <p className="text-sm text-destructive">{errors.mnc}</p>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeOptions.map((type) => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-destructive">{errors.status}</p>
                                    )}
                                </div>

                                {/* Country Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="country_name">Country Name</Label>
                                    <Input
                                        id="country_name"
                                        value={formData.country_name}
                                        onChange={(e) => handleChange('country_name', e.target.value)}
                                        placeholder="e.g., Austria"
                                    />
                                    {errors.country_name && (
                                        <p className="text-sm text-destructive">{errors.country_name}</p>
                                    )}
                                </div>

                                {/* Country Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="country_code">Country Code</Label>
                                    <Input
                                        id="country_code"
                                        value={formData.country_code}
                                        onChange={(e) => handleChange('country_code', e.target.value)}
                                        placeholder="e.g., AT"
                                    />
                                    {errors.country_code && (
                                        <p className="text-sm text-destructive">{errors.country_code}</p>
                                    )}
                                </div>

                                {/* Brand */}
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <Input
                                        id="brand"
                                        value={formData.brand}
                                        onChange={(e) => handleChange('brand', e.target.value)}
                                        placeholder="e.g., A1.net"
                                    />
                                    {errors.brand && (
                                        <p className="text-sm text-destructive">{errors.brand}</p>
                                    )}
                                </div>

                                {/* Operator */}
                                <div className="space-y-2">
                                    <Label htmlFor="operator">Operator</Label>
                                    <Input
                                        id="operator"
                                        value={formData.operator}
                                        onChange={(e) => handleChange('operator', e.target.value)}
                                        placeholder="e.g., A1 Telekom Austria"
                                    />
                                    {errors.operator && (
                                        <p className="text-sm text-destructive">{errors.operator}</p>
                                    )}
                                </div>
                            </div>

                            {/* Bands */}
                            <div className="space-y-2">
                                <Label htmlFor="bands">Bands</Label>
                                <Textarea
                                    id="bands"
                                    value={formData.bands}
                                    onChange={(e) => handleChange('bands', e.target.value)}
                                    placeholder="e.g., GSM 900 / UMTS 900 / UMTS 2100 / LTE 800 / LTE 1800 / LTE 2100 / LTE 2600 / 5G 3500"
                                    rows={3}
                                />
                                {errors.bands && (
                                    <p className="text-sm text-destructive">{errors.bands}</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={3}
                                />
                                {errors.notes && (
                                    <p className="text-sm text-destructive">{errors.notes}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Create MCC-MNC
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.get('/mcc-mnc')}
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
