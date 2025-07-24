import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Phone, MessageSquare, User, Edit, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        title: 'Details',
        href: '/blacklist-numbers/show',
    },
];

interface BlacklistNumber {
    id: number;
    number: string;
    type: 'sms' | 'manual';
    reason: string | null;
    created_at: string;
    updated_at: string;
}

export default function BlacklistNumbersShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [blacklistNumber, setBlacklistNumber] = useState<BlacklistNumber | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Fetch blacklist number data
    useEffect(() => {
        const fetchBlacklistNumber = async () => {
            if (!id) return;
            
            try {
                const data = await apiClient.get<BlacklistNumber>(`/blacklist-numbers/${id}`);
                setBlacklistNumber(data);
            } catch (error) {
                console.error('Error fetching blacklist number:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlacklistNumber();
    }, [id]);

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!blacklistNumber) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Blacklist number not found</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleDelete = async () => {
        try {
            await apiClient.delete(`/blacklist-numbers/${blacklistNumber.id}`);
            navigate('/blacklist-numbers');
        } catch (error) {
            console.error('Error deleting blacklist number:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getTypeIcon = (type: string) => {
        return type === 'sms' ? <MessageSquare className="h-4 w-4" /> : <User className="h-4 w-4" />;
    };

    const getTypeVariant = (type: string) => {
        return type === 'sms' ? 'destructive' : 'default';
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
                            <h1 className="text-3xl font-bold tracking-tight">Blacklist Number Details</h1>
                            <p className="text-muted-foreground">
                                View detailed information about this blacklisted number
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/blacklist-numbers/${blacklistNumber.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Phone Number</span>
                                <span className="font-mono text-lg">{blacklistNumber.number}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Type</span>
                                <Badge variant={getTypeVariant(blacklistNumber.type)}>
                                    {getTypeIcon(blacklistNumber.type)}
                                    <span className="ml-1">{blacklistNumber.type.toUpperCase()}</span>
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Reason</span>
                                <div className="p-3 bg-muted rounded-md">
                                    {blacklistNumber.reason ? (
                                        <p className="text-sm">{blacklistNumber.reason}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No reason provided</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Created At</span>
                                </div>
                                <p className="text-sm">{formatDate(blacklistNumber.created_at)}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                </div>
                                <p className="text-sm">{formatDate(blacklistNumber.updated_at)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Warning Card */}
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Impact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm">
                                <strong>This number is currently blocked from receiving SMS messages.</strong>
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• All incoming SMS messages to this number are rejected</li>
                                <li>• The number cannot receive any SMS notifications</li>
                                <li>• This affects all SMS services and applications</li>
                                <li>• Changes take effect immediately</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <Link to={`/blacklist-numbers/${blacklistNumber.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Number
                        </Button>
                    </Link>
                    <Link to="/blacklist-numbers">
                        <Button variant="outline">
                            Back to List
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this blacklist number? This will allow the number 
                            to receive SMS messages again. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 