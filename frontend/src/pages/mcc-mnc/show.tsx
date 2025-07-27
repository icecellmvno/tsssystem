
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { mccMncService, type MccMnc } from '@/services/mcc-mnc';
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
        title: 'Details',
        href: '/mcc-mnc/:id',
    },
];

export default function MccMncShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [mccMnc, setMccMnc] = useState<MccMnc | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchMccMnc = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const data = await mccMncService.getById(parseInt(id));
                setMccMnc(data);
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

    const handleDelete = async () => {
        if (!mccMnc || !confirm('Are you sure you want to delete this MCC-MNC record?')) {
            return;
        }

        try {
            setDeleting(true);
            await mccMncService.delete(mccMnc.id);
            toast.success('MCC-MNC record deleted successfully');
            navigate('/mcc-mnc');
        } catch (error) {
            console.error('Error deleting MCC-MNC record:', error);
            toast.error('Failed to delete MCC-MNC record');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

    if (!mccMnc) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">MCC-MNC record not found</div>
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
                        <h1 className="text-3xl font-bold tracking-tight">MCC-MNC Details</h1>
                        <p className="text-muted-foreground">
                            View details for MCC-MNC record
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/mcc-mnc')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Button>
                        <Button onClick={() => navigate(`/mcc-mnc/${mccMnc.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>

                {/* MCC-MNC Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>MCC-MNC Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">MCC (Mobile Country Code)</label>
                                    <p className="text-lg font-mono">{mccMnc.mcc}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">MNC (Mobile Network Code)</label>
                                    <p className="text-lg font-mono">{mccMnc.mnc}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ISO Code</label>
                                    <p className="text-lg">
                                        <Badge variant="outline">{mccMnc.iso.toUpperCase()}</Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Country Code</label>
                                    <p className="text-lg">{mccMnc.country_code}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                                    <p className="text-lg">{mccMnc.country}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Network</label>
                                    <p className="text-lg">{mccMnc.network}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Record ID</label>
                                    <p className="text-lg font-mono text-muted-foreground">#{mccMnc.id}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <p className="text-sm">{formatDate(mccMnc.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                <p className="text-sm">{formatDate(mccMnc.updated_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
