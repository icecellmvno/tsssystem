import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { Search, Filter, ArrowUpDown, MessageSquare, Calendar, Phone, Hash, Settings } from 'lucide-react';
import { ussdLogsService, type UssdLog, type UssdLogFilters, type UssdLogFilterOptions } from '@/services/ussd-logs';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'USSD Logs',
        href: '/ussd-logs',
    },
];

export default function UssdLogsIndex() {
    const [ussdLogs, setUssdLogs] = useState<UssdLog[]>([]);
    const [filterOptions, setFilterOptions] = useState<UssdLogFilterOptions>({
        statuses: [],
        device_ids: [],
        ussd_codes: [],
        device_group_ids: [],
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UssdLogFilters>({
        page: 1,
        per_page: 15,
        search: '',
        status: 'all',
        device_id: 'all',
        ussd_code: 'all',
        device_group_id: 'all',
        start_date: '',
        end_date: '',
        sort_by: 'created_at',
        sort_order: 'desc',
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
    });

    // Fetch USSD logs and filter options
    const fetchData = async () => {
        try {
            setLoading(true);
            const [logsResponse, optionsResponse] = await Promise.all([
                ussdLogsService.getUssdLogs(filters),
                ussdLogsService.getFilterOptions(),
            ]);
            
            setUssdLogs(logsResponse.data);
            setPagination({
                current_page: logsResponse.current_page,
                last_page: logsResponse.last_page,
                per_page: logsResponse.per_page,
                total: logsResponse.total,
                from: logsResponse.from,
                to: logsResponse.to,
            });
            setFilterOptions(optionsResponse);
        } catch (error) {
            console.error('Error fetching USSD logs:', error);
            toast.error('Failed to fetch USSD logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (field: string) => {
        const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
        setFilters(prev => ({
            ...prev,
            sort_by: field,
            sort_order: newOrder,
            page: 1,
        }));
    };

    const clearFilters = () => {
        setFilters({
            page: 1,
            per_page: 15,
            search: '',
            status: 'all',
            device_id: 'all',
            ussd_code: 'all',
            device_group_id: 'all',
            start_date: '',
            end_date: '',
            sort_by: 'created_at',
            sort_order: 'desc',
        });
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'failed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const truncateMessage = (message: string | null, maxLength: number = 40) => {
        if (!message) return '-';
        return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading USSD logs...</p>
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
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">USSD Logs</h1>
                        <p className="text-muted-foreground">
                            View and manage USSD session logs and responses
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search logs..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {filterOptions.statuses.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="device_id">Device ID</Label>
                                <Select value={filters.device_id} onValueChange={(value) => setFilters(prev => ({ ...prev, device_id: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select device" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Devices</SelectItem>
                                        {filterOptions.device_ids.map((deviceId) => (
                                            <SelectItem key={deviceId} value={deviceId}>
                                                {deviceId}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ussd_code">USSD Code</Label>
                                <Select value={filters.ussd_code} onValueChange={(value) => setFilters(prev => ({ ...prev, ussd_code: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select USSD code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Codes</SelectItem>
                                        {filterOptions.ussd_codes.map((code) => (
                                            <SelectItem key={code} value={code}>
                                                {code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="per_page">Per Page</Label>
                                <Select value={filters.per_page?.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, per_page: parseInt(value) }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>USSD Logs ({pagination.total} total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ussdLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No USSD logs found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <Button variant="ghost" onClick={() => handleSort('id')}>
                                                    ID
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button variant="ghost" onClick={() => handleSort('session_id')}>
                                                    Session ID
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button variant="ghost" onClick={() => handleSort('device_id')}>
                                                    Device ID
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button variant="ghost" onClick={() => handleSort('ussd_code')}>
                                                    USSD Code
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Request</TableHead>
                                            <TableHead>Response</TableHead>
                                            <TableHead>
                                                <Button variant="ghost" onClick={() => handleSort('created_at')}>
                                                    Created
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ussdLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{log.id}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {truncateMessage(log.session_id, 20)}
                                                </TableCell>
                                                <TableCell>{log.device_id}</TableCell>
                                                <TableCell className="font-mono">
                                                    {log.ussd_code}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(log.status)}>
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    {truncateMessage(log.request_message)}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    {truncateMessage(log.response_message)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(log.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/ussd-logs/${log.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-muted-foreground">
                                    Showing {pagination.from} to {pagination.to} of {pagination.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page <= 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {pagination.current_page} of {pagination.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page >= pagination.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
