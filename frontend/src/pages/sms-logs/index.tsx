import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Search, RefreshCw, MessageSquare, Phone, Building2, ArrowUp, ArrowDown, Calendar, CheckCircle, Clock, DollarSign, Hash, Settings, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Clock4 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/contexts/websocket-context';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { smsLogsService, type SmsLogItem } from '@/services/sms-logs';
import { ColumnDef } from '@tanstack/react-table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'SMS Logs', href: '/sms-logs' },
];

export default function SmsLogsIndex() {
    const { user, token, isAuthenticated } = useAuthStore();
    const { smsLogs: realtimeSmsLogs } = useWebSocket();
    
    const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    // Fetch SMS logs
    const fetchSmsLogs = async () => {
        if (!isAuthenticated || !token) return;

        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: currentPage,
                per_page: pageSize,
                search: search || undefined,
            };

            const response = await smsLogsService.getAll(params);
            
            setSmsLogs(response.data);
            setTotalRecords(response.total);
            setTotalPages(response.last_page);
        } catch (error) {
            console.error('Error fetching SMS logs:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch SMS logs');
            toast.error('Failed to fetch SMS logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSmsLogs();
    }, [currentPage, pageSize, search, isAuthenticated, token]);

    // Combine API data with real-time data
    const combinedSmsLogs = useMemo(() => {
        const apiLogs = smsLogs || [];
        const realtimeLogs = realtimeSmsLogs || [];
        
        const merged = [...apiLogs];
        
        realtimeLogs.forEach(realtimeLog => {
            // Check for duplicates using message_id first, then id, then phone_number + timestamp
            const existingIndex = merged.findIndex(log => {
                // If both have message_id, compare by message_id
                if (log.message_id && realtimeLog.message_id) {
                    return log.message_id === realtimeLog.message_id;
                }
                // If both have id, compare by id
                if (log.id && realtimeLog.id) {
                    return log.id === realtimeLog.id;
                }
                // For inbound SMS without message_id, compare by phone_number + timestamp
                if (log.direction === 'inbound' && realtimeLog.direction === 'inbound') {
                    return log.destination_addr === realtimeLog.destination_addr && 
                           log.created_at === realtimeLog.created_at;
                }
                return false;
            });
            
            if (existingIndex === -1) {
                // Add new real-time log at the beginning
                merged.unshift(realtimeLog);
            } else {
                // Update existing log with real-time data
                merged[existingIndex] = { ...merged[existingIndex], ...realtimeLog };
            }
        });
        
        return merged;
    }, [smsLogs, realtimeSmsLogs]);

    // Calculate stats from combined data
    const stats = useMemo(() => {
        const total = combinedSmsLogs.length;
        const delivered = combinedSmsLogs.filter(log => log.status === 'delivered').length;
        const failed = combinedSmsLogs.filter(log => log.status === 'failed').length;
        const pending = combinedSmsLogs.filter(log => log.status === 'pending').length;
        const outbound = combinedSmsLogs.filter(log => log.direction === 'outbound').length;
        const inbound = combinedSmsLogs.filter(log => log.direction === 'inbound').length;
        
        // Calculate total cost
        const totalCost = combinedSmsLogs.reduce((sum, log) => {
            const cost = parseFloat(log.total_cost || '0');
            return sum + cost;
        }, 0);

        // Calculate success rate
        const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0';

        return {
            total,
            delivered,
            failed,
            pending,
            outbound,
            inbound,
            totalCost: totalCost.toFixed(2),
            successRate
        };
    }, [combinedSmsLogs]);

    // Column definitions based on the JSON structure
    const columns: ColumnDef<SmsLogItem>[] = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => (
                <div className="font-mono text-sm">{row.getValue('id')}</div>
            ),
        },
        {
            accessorKey: 'message_id',
            header: 'Message ID',
            cell: ({ row }) => (
                <div className="font-mono text-xs max-w-[300px] truncate">
                    {row.getValue('message_id')}
                </div>
            ),
        },
        {
            accessorKey: 'direction',
            header: 'Direction',
            cell: ({ row }) => {
                const direction = row.getValue('direction') as string;
                return (
                    <div className="flex items-center gap-2">
                        {direction === 'outbound' ? (
                            <ArrowUp className="h-3 w-3 text-blue-500" />
                        ) : (
                            <ArrowDown className="h-3 w-3 text-green-500" />
                        )}
                        <Badge variant={direction === 'outbound' ? 'default' : 'secondary'}>
                            {direction}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'source_addr',
            header: 'Source',
            cell: ({ row }) => {
                const sourceAddr = row.getValue('source_addr') as string || null;
                return (
                    <div className="text-sm font-mono">
                        {sourceAddr || 'Panel'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'source_connector',
            header: 'Connector',
            cell: ({ row }) => {
                const connector = row.getValue('source_connector') as string || null;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {connector || '-'}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'source_user',
            header: 'User',
            cell: ({ row }) => {
                const user = row.getValue('source_user') as string || null;
                return (
                    <div className="text-sm">
                        {user || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'destination_addr',
            header: 'Destination',
            cell: ({ row }) => {
                const destAddr = row.getValue('destination_addr') as string || null;
                return (
                    <div className="text-sm font-mono">
                        {destAddr || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }) => {
                const message = row.getValue('message') as string || null;
                const messageLength = row.getValue('message_length') as number || (message ? message.length : 0);
                
                if (!message) return <span className="text-muted-foreground">-</span>;
                
                // SMS count calculation
                let smsCount = 1;
                let charsLeft = 0;
                
                try {
                    if (typeof window !== 'undefined' && (window as any).SMS) {
                        const sms = new (window as any).SMS();
                        const result = sms.count(message);
                        smsCount = result.totalSms;
                        charsLeft = result.charsLeft;
                    } else {
                        smsCount = Math.ceil(messageLength / 160);
                    }
        } catch (error) {
                    smsCount = Math.ceil(messageLength / 160);
                }
                
                const truncated = message.length > 50 ? `${message.substring(0, 50)}...` : message;
                
                return (
                    <div className="max-w-xs">
                        <div className="text-sm">{truncated}</div>
                        <div className="text-xs text-muted-foreground">
                            {messageLength} chars • {smsCount} SMS
                            {charsLeft > 0 && charsLeft < 160 && (
                                <span className="ml-1">({charsLeft} left)</span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'device_name',
            header: 'Device',
            cell: ({ row }) => {
                const name = row.getValue('device_name') as string || null;
                return (
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{name || '-'}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'device_group',
            header: 'Group',
            cell: ({ row }) => {
                const group = row.getValue('device_group') as string || null;
                return (
                    <div className="text-sm">
                        {group || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'country_site',
            header: 'Site',
            cell: ({ row }) => {
                const site = row.getValue('country_site') as string || null;
                return (
                    <div className="text-sm">
                        {site || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'simcard_name',
            header: 'SIM Name',
            cell: ({ row }) => {
                const name = row.getValue('simcard_name') as string || null;
                return (
                    <div className="text-sm">
                        {name || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'sim_slot',
            header: 'Slot',
            cell: ({ row }) => {
                const slot = row.getValue('sim_slot') as number || null;
                return (
                    <div className="text-sm">
                        {slot || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'device_imsi',
            header: 'IMSI',
            cell: ({ row }) => {
                const imsi = row.getValue('device_imsi') as string || null;
                return (
                    <div className="text-sm font-mono">
                        {imsi || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => {
                const priority = row.getValue('priority') as string || null;
                return (
                    <div className="text-sm">
                        {priority || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'retry_count',
            header: 'Retries',
            cell: ({ row }) => {
                const retryCount = row.getValue('retry_count') as number || 0;
                const maxRetries = row.getValue('max_retries') as number || 3;
                return (
                    <div className="text-sm">
                        {retryCount}/{maxRetries}
                    </div>
                );
            },
        },
        {
            accessorKey: 'total_cost',
            header: 'Cost',
            cell: ({ row }) => {
                const cost = row.getValue('total_cost') as string || '0.00';
                const currency = row.getValue('currency') as string || 'TRY';
                return (
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">
                            {cost} {currency}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'smpp_sent',
            header: 'SMPP',
            cell: ({ row }) => {
                const smppSent = row.getValue('smpp_sent') as boolean || false;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant={smppSent ? 'default' : 'secondary'}>
                            {smppSent ? 'Sent' : 'Not Sent'}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'delivery_report_requested',
            header: 'DR',
            cell: ({ row }) => {
                const drRequested = row.getValue('delivery_report_requested') as boolean || false;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant={drRequested ? 'default' : 'secondary'}>
                            {drRequested ? 'Yes' : 'No'}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => {
                const date = row.getValue('created_at') as string;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {new Date(date).toLocaleDateString()}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'received_at',
            header: 'Received',
            cell: ({ row }) => {
                const date = row.getValue('received_at') as string || null;
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {date ? new Date(date).toLocaleDateString() : '-'}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                
                if (status === 'delivered') variant = 'default';
                else if (status === 'failed') variant = 'destructive';
                else if (status === 'pending') variant = 'outline';
                
                return (
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={variant}>{status}</Badge>
                    </div>
                );
            },
        },
    ], []);

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-muted-foreground">Please log in to view SMS logs.</p>
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
                        <p className="text-muted-foreground">Loading SMS logs...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-destructive">Error loading SMS logs: {error}</p>
                        <Button onClick={fetchSmsLogs} className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const emptyState = (
        <div className="flex items-center justify-center py-8">
            <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-sm font-semibold">No SMS logs found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No SMS logs match your current filters.
                </p>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">SMS Logs</h1>
                        <p className="text-muted-foreground">
                            Monitor and manage SMS message logs ({totalRecords} total records)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchSmsLogs}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {/* Total SMS */}
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                            <CardTitle className="text-xs font-medium">Total SMS</CardTitle>
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="text-lg font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.outbound} outbound, {stats.inbound} inbound
                            </p>
                        </CardContent>
                    </Card>

                    {/* Delivered SMS */}
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                            <CardTitle className="text-xs font-medium">Delivered</CardTitle>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="text-lg font-bold text-green-600">{stats.delivered}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.successRate}% success rate
                            </p>
                        </CardContent>
                    </Card>

                    {/* Failed SMS */}
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                            <CardTitle className="text-xs font-medium">Failed</CardTitle>
                            <XCircle className="h-3 w-3 text-red-500" />
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="text-lg font-bold text-red-600">{stats.failed}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : '0'}% failure rate
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pending SMS */}
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                            <CardTitle className="text-xs font-medium">Pending</CardTitle>
                            <Clock4 className="h-3 w-3 text-yellow-500" />
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : '0'}% pending
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Cost */}
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                            <CardTitle className="text-xs font-medium">Total Cost</CardTitle>
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="text-lg font-bold">{stats.totalCost} USD</div>
                            <p className="text-xs text-muted-foreground">
                                Average: {stats.total > 0 ? (parseFloat(stats.totalCost) / stats.total).toFixed(4) : '0'} USD per SMS
                            </p>
                        </CardContent>
                    </Card>

                    {/* Real-time Status */}
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                            <CardTitle className="text-xs font-medium">Real-time Status</CardTitle>
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="text-lg font-bold text-blue-600">Live</div>
                            <p className="text-xs text-muted-foreground">
                                {realtimeSmsLogs?.length || 0} real-time updates
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search messages, devices, phone numbers..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button onClick={() => setSearch('')} variant="outline">
                                Clear
                                </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <DataTable
                    columns={columns}
                    data={combinedSmsLogs}
                    title={`SMS Logs (Page ${currentPage} of ${totalPages})`}
                    description={`Showing ${combinedSmsLogs.length} of ${totalRecords} total records`}
                    emptyState={emptyState}
                    pageSize={pageSize}
                    showSearch={false}
                    showViewOptions={false}
                    showPagination={false}
                    className="space-y-4"
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">Rows per page:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value))}
                                            className="border rounded px-2 py-1 text-sm"
                                        >
                                            {[5, 10, 15, 20, 25, 30, 40, 50, 100].map((size) => (
                                                <option key={size} value={size}>
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            First
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Last
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
} 