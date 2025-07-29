import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, MessageSquare, Phone, Building2, Calendar, Clock, CheckCircle, XCircle, Clock4, DollarSign, Hash, Settings, ArrowUp, ArrowDown, User, Globe, Filter, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { smsLogsService, type SmsLogItem } from '@/services/sms-logs';

export default function SmsLogShow() {
    const { id } = useParams<{ id: string }>();
    const { user, token, isAuthenticated } = useAuthStore();
    
    const [smsLog, setSmsLog] = useState<SmsLogItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters for related SMS logs
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [sourceAddress, setSourceAddress] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'SMS Logs', href: '/sms-logs' },
        { title: `SMS Log #${id}`, href: `/sms-logs/${id}` },
    ];

    // Fetch SMS log details
    const fetchSmsLog = async () => {
        if (!isAuthenticated || !token || !id) return;

        try {
            setLoading(true);
            setError(null);
            
            const data = await smsLogsService.getById(parseInt(id));
            setSmsLog(data);
        } catch (error) {
            console.error('Error fetching SMS log:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch SMS log');
            toast.error('Failed to fetch SMS log');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSmsLog();
    }, [id, isAuthenticated, token]);

    // Clear all filters
    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
        setSourceAddress('');
        setDestinationAddress('');
    };

    // Check if any filters are active
    const hasActiveFilters = startDate || endDate || startTime || endTime || sourceAddress || destinationAddress;

    // SMS count calculation
    const getSmsCount = (message: string) => {
        if (!message) return { count: 0, charsLeft: 0, limit: 160 };
        
        try {
            if (typeof window !== 'undefined' && (window as any).SMS) {
                const sms = new (window as any).SMS();
                const result = sms.count(message);
                return {
                    count: result.totalSms,
                    charsLeft: result.charsLeft,
                    limit: result.limit
                };
            } else {
                const count = Math.ceil(message.length / 160);
                const charsLeft = 160 - (message.length % 160);
                return { count, charsLeft, limit: 160 };
            }
        } catch (error) {
            const count = Math.ceil(message.length / 160);
            const charsLeft = 160 - (message.length % 160);
            return { count, charsLeft, limit: 160 };
        }
    };

    // Get status badge variant
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'delivered': return 'default';
            case 'failed': return 'destructive';
            case 'pending': return 'outline';
            default: return 'secondary';
        }
    };

    // Get direction icon
    const getDirectionIcon = (direction: string) => {
        return direction === 'outbound' ? (
            <ArrowUp className="h-4 w-4 text-blue-500" />
        ) : (
            <ArrowDown className="h-4 w-4 text-green-500" />
        );
    };

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-muted-foreground">Please log in to view SMS log details.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading SMS log details...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !smsLog) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-destructive">Error loading SMS log: {error}</p>
                        <Button onClick={fetchSmsLog} className="mt-4">
                            Retry
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const smsCount = getSmsCount(smsLog.message || '');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/sms-logs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to SMS Logs
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">SMS Log #{smsLog.id}</h1>
                            <p className="text-muted-foreground">
                                Message ID: {smsLog.message_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(smsLog.status || '')}>
                            {smsLog.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                            {getDirectionIcon(smsLog.direction || '')}
                            <Badge variant={smsLog.direction === 'outbound' ? 'default' : 'secondary'}>
                                {smsLog.direction}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Filters for Related SMS Logs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Related SMS Logs Filters</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="space-y-4">
                                {/* Date and Time Range */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-date">Start Date</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-date">End Date</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="start-time">Start Time</Label>
                                        <Input
                                            id="start-time"
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-time">End Time</Label>
                                        <Input
                                            id="end-time"
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Address Filters */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="source-address">Source Address</Label>
                                        <Input
                                            id="source-address"
                                            placeholder="Enter source address..."
                                            value={sourceAddress}
                                            onChange={(e) => setSourceAddress(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="destination-address">Destination Address</Label>
                                        <Input
                                            id="destination-address"
                                            placeholder="Enter destination address..."
                                            value={destinationAddress}
                                            onChange={(e) => setDestinationAddress(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {hasActiveFilters && (
                                    <div className="flex flex-wrap gap-2">
                                        {startDate && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                From: {startDate}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => setStartDate('')}
                                                />
                                            </Badge>
                                        )}
                                        {endDate && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                To: {endDate}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => setEndDate('')}
                                                />
                                            </Badge>
                                        )}
                                        {startTime && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                From Time: {startTime}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => setStartTime('')}
                                                />
                                            </Badge>
                                        )}
                                        {endTime && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                To Time: {endTime}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => setEndTime('')}
                                                />
                                            </Badge>
                                        )}
                                        {sourceAddress && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                Source: {sourceAddress}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => setSourceAddress('')}
                                                />
                                            </Badge>
                                        )}
                                        {destinationAddress && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                Destination: {destinationAddress}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => setDestinationAddress('')}
                                                />
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Filter Actions */}
                                <div className="flex items-center gap-2">
                                    <Link 
                                        to={`/sms-logs?start_date=${startDate}&end_date=${endDate}&start_time=${startTime}&end_time=${endTime}&source_addr=${sourceAddress}&destination_addr=${destinationAddress}`}
                                    >
                                        <Button size="sm">
                                            View Related SMS Logs
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Message Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Message Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Message Content</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">{smsLog.message || '-'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Length</label>
                                    <p className="text-sm">{smsLog.message_length || 0} characters</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SMS Count</label>
                                    <p className="text-sm">{smsCount.count} SMS</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Characters Left</label>
                                    <p className="text-sm">{smsCount.charsLeft} to next SMS</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                    <p className="text-sm">{smsLog.priority || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Communication Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Communication Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Source Address</label>
                                <p className="text-sm font-mono">{smsLog.source_addr || 'Panel'}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Destination Address</label>
                                <p className="text-sm font-mono">{smsLog.destination_addr || '-'}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Source Connector</label>
                                    <Badge variant="outline" className="text-xs">
                                        {smsLog.source_connector || '-'}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Source User</label>
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span className="text-sm">{smsLog.source_user || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Device & SIM Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Device & SIM Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                                <p className="text-sm">{smsLog.device_name || '-'}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                                    <p className="text-sm">{smsLog.device_group || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Country Site</label>
                                    <p className="text-sm">{smsLog.country_site || '-'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">SIM Card</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{smsLog.simcard_name || 'Unknown'}</span>
                                    {smsLog.sim_slot && (
                                        <Badge variant="outline" className="text-xs">
                                            Slot {smsLog.sim_slot}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">IMSI</label>
                                <p className="text-sm font-mono">{smsLog.device_imsi || '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status & Timing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Status & Timing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {smsLog.status === 'delivered' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    {smsLog.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                                    {smsLog.status === 'pending' && <Clock4 className="h-4 w-4 text-yellow-500" />}
                                    <Badge variant={getStatusVariant(smsLog.status || '')}>
                                        {smsLog.status}
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-sm">
                                            {new Date(smsLog.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Received At</label>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-sm">
                                            {smsLog.received_at ? new Date(smsLog.received_at).toLocaleString() : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Retry Count</label>
                                    <p className="text-sm">{smsLog.retry_count || 0} / {smsLog.max_retries || 3}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SMPP Sent</label>
                                    <Badge variant={smsLog.smpp_sent ? 'default' : 'secondary'}>
                                        {smsLog.smpp_sent ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cost & Technical Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Cost & Technical Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                                    <p className="text-sm font-mono">{smsLog.total_cost || '0.00'} USD</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Currency</label>
                                    <p className="text-sm">{smsLog.currency || 'USD'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Delivery Report</label>
                                <Badge variant={smsLog.delivery_report_requested ? 'default' : 'secondary'}>
                                    {smsLog.delivery_report_requested ? 'Requested' : 'Not Requested'}
                                </Badge>
                            </div>
                            
                            {smsLog.error_message && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                        {smsLog.error_message}
                                    </p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">PDU Count</label>
                                    <p className="text-sm">{smsLog.pdu_count || 1}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Blacklisted</label>
                                    <Badge variant={smsLog.is_blacklisted ? 'destructive' : 'secondary'}>
                                        {smsLog.is_blacklisted ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 