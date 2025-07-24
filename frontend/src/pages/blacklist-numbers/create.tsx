import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Phone, MessageSquare, User, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/services/api-client';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Blacklist Numbers',
        href: '/blacklist-numbers',
    },
    {
        title: 'Create',
        href: '/blacklist-numbers/create',
    },
];

export default function BlacklistNumbersCreate() {
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [data, setData] = useState({
        number: '',
        type: 'manual' as 'sms' | 'manual',
        reason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            await apiClient.post('/blacklist-numbers', data);
            navigate('/blacklist-numbers');
        } catch (error) {
            console.error('Error creating blacklist number:', error);
            if (error instanceof Error) {
                setErrors({ general: error.message });
            }
        } finally {
            setProcessing(false);
        }
    };

    const formatNumber = (value: string) => {
        // Remove all non-digit characters except +
        let formatted = value.replace(/[^\d+]/g, '');
        
        // Ensure it starts with +
        if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        
        return formatted;
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumber(e.target.value);
        setData('number', formatted);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/blacklist-numbers">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Blacklist
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Add Blacklist Number</h1>
                            <p className="text-muted-foreground">
                                Add a new phone number to the blacklist
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Blacklist Number Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Phone Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="number">Phone Number *</Label>
                                    <Input
                                        id="number"
                                        type="tel"
                                        placeholder="+905551234567"
                                        value={data.number}
                                        onChange={handleNumberChange}
                                        className={errors.number ? 'border-destructive' : ''}
                                    />
                                    {errors.number && (
                                        <p className="text-sm text-destructive">{errors.number}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Enter the phone number in international format (e.g., +905551234567)
                                    </p>
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Manual
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="sms">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" />
                                                    SMS
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Select how this number was added to the blacklist
                                    </p>
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Enter the reason for blacklisting this number..."
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        rows={4}
                                        className={errors.reason ? 'border-destructive' : ''}
                                    />
                                    {errors.reason && (
                                        <p className="text-sm text-destructive">{errors.reason}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Optional reason for adding this number to the blacklist
                                    </p>
                                </div>

                                {/* Info Alert */}
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Important:</strong> Once a number is added to the blacklist, 
                                        it will be blocked from receiving SMS messages. Make sure you have 
                                        the correct number before proceeding.
                                    </AlertDescription>
                                </Alert>

                                {/* Actions */}
                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Add to Blacklist
                                            </>
                                        )}
                                    </Button>
                                    <Link to="/blacklist-numbers">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 