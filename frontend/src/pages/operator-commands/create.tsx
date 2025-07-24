import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save, MessageSquare, Phone } from 'lucide-react';

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
        title: 'Create Command',
        href: '#',
    },
];

interface MccMncItem {
    id: number;
    mcc: string;
    mnc: string;
    country_name: string;
    brand: string;
    operator: string;
}

interface Props {
    mccMnc: MccMncItem | null;
    mccMncId: string | null;
}

export default function OperatorCommandCreate({ mccMnc, mccMncId }: Props) {
    const [formData, setFormData] = useState({
        mcc_mnc_id: mccMncId || '',
        name: '',
        command_type: '',
        key: '',
        code: '',
        message_text: '',
        number: '',
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
        
        router.post('/operator-commands', formData, {
            onError: (errors) => {
                setErrors(errors);
            },
        });
    };

    const commandTypeOptions = [
        { value: 'sms', label: 'SMS' },
        { value: 'ussd', label: 'USSD' },
    ];

    const keyOptions = [
        { value: 'main_balance_check', label: 'Main Balance Check' },
        { value: 'sms_balance_check', label: 'SMS Balance Check' },
        { value: 'buy_pack_command', label: 'Buy Pack Command' },
        { value: 'phonenumber_check', label: 'Phone Number Check' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Operator Command" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get(`/mcc-mnc/${mccMncId}`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Operator Command</h1>
                        <p className="text-muted-foreground">
                            Add a new command for {mccMnc ? `${mccMnc.brand} (${mccMnc.mcc}-${mccMnc.mnc})` : 'MCC-MNC'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Command Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="e.g., Check Balance"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Command Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="command_type">Command Type *</Label>
                                    <Select value={formData.command_type} onValueChange={(value) => handleChange('command_type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select command type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {commandTypeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.command_type && (
                                        <p className="text-sm text-destructive">{errors.command_type}</p>
                                    )}
                                </div>

                                {/* Key */}
                                <div className="space-y-2">
                                    <Label htmlFor="key">Key *</Label>
                                    <Select value={formData.key} onValueChange={(value) => handleChange('key', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select key" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {keyOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.key && (
                                        <p className="text-sm text-destructive">{errors.key}</p>
                                    )}
                                </div>

                                {/* Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => handleChange('code', e.target.value)}
                                        placeholder={formData.command_type === 'sms' ? 'e.g., BAL' : 'e.g., *100#'}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-destructive">{errors.code}</p>
                                    )}
                                </div>
                            </div>

                            {/* SMS Specific Fields */}
                            {formData.command_type === 'sms' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Message Text */}
                                    <div className="space-y-2">
                                        <Label htmlFor="message_text">Message Text</Label>
                                        <Textarea
                                            id="message_text"
                                            value={formData.message_text}
                                            onChange={(e) => handleChange('message_text', e.target.value)}
                                            placeholder="e.g., BAL"
                                            rows={3}
                                        />
                                        {errors.message_text && (
                                            <p className="text-sm text-destructive">{errors.message_text}</p>
                                        )}
                                    </div>

                                    {/* Number */}
                                    <div className="space-y-2">
                                        <Label htmlFor="number">Number</Label>
                                        <Input
                                            id="number"
                                            value={formData.number}
                                            onChange={(e) => handleChange('number', e.target.value)}
                                            placeholder="e.g., 1234"
                                        />
                                        {errors.number && (
                                            <p className="text-sm text-destructive">{errors.number}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Command
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.get(`/mcc-mnc/${mccMncId}`)}
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