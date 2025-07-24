import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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

interface UssdLogItem {
    id: number;
    session_id: string;
    device_id: string;
    ussd_code: string;
    request_message: string | null;
    response_message: string | null;
    status: string;
    sent_at: string | null;
    received_at: string | null;
    error_message: string | null;
    metadata: any;
    device_group_id: number | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: UssdLogItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface Props {
    ussdLogs: PaginatedData;
    filters: {
        search: string;
        status: string;
        device_id: string;
        ussd_code: string;
        device_group_id: string;
        start_date: string;
        end_date: string;
        sort_by: string;
        sort_order: string;
    };
    filterOptions: {
        statuses: string[];
        deviceIds: string[];
        ussdCodes: string[];
        deviceGroupIds: number[];
    };
}

export default function UssdLogsIndex({ ussdLogs, filters, filterOptions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [deviceId, setDeviceId] = useState(filters.device_id || 'all');
    const [ussdCode, setUssdCode] = useState(filters.ussd_code || 'all');
    const [deviceGroupId, setDeviceGroupId] = useState(filters.device_group_id || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleSearch = () => {
        router.get('/ussd-logs', {
            search,
            status,
            device_id: deviceId,
            ussd_code: ussdCode,
            device_group_id: deviceGroupId,
            start_date: startDate,
            end_date: endDate,
            sort_by: sortBy,
            sort_order: sortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (field: string) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
        router.get('/ussd-logs', {
            search,
            status,
            device_id: deviceId,
            ussd_code: ussdCode,
            device_group_id: deviceGroupId,
            start_date: startDate,
            end_date: endDate,
            sort_by: field,
            sort_order: newOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setDeviceId('all');
        setUssdCode('all');
        setDeviceGroupId('all');
        setStartDate('');
        setEndDate('');
        setSortBy('created_at');
        setSortOrder('desc');
        router.get('/ussd-logs', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
                return 'default';
            case 'failed':
                return 'destructive';
            case 'pending':
                return 'secondary';
            case 'timeout':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const truncateMessage = (message: string | null, maxLength: number = 40) => {
        if (!message) return 'N/A';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="USSD Logs" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">USSD Logs</h1>
                        <p className="text-muted-foreground">
                            Total records: {ussdLogs.total}
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by device ID, USSD code, messages, or session ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filter USSD Logs</SheetTitle>
                                <SheetDescription>
                                    Apply filters to narrow down your search results.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-3 mt-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="status" className="text-xs">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                {filterOptions.statuses.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="device_id" className="text-xs">Device ID</Label>
                                        <Select value={deviceId} onValueChange={setDeviceId}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select device ID" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Devices</SelectItem>
                                                {filterOptions.deviceIds.map((deviceId) => (
                                                    <SelectItem key={deviceId} value={deviceId}>{deviceId}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="ussd_code" className="text-xs">USSD Code</Label>
                                        <Select value={ussdCode} onValueChange={setUssdCode}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select USSD code" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All USSD Codes</SelectItem>
                                                {filterOptions.ussdCodes.map((code) => (
                                                    <SelectItem key={code} value={code}>{code}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="device_group_id" className="text-xs">Device Group</Label>
                                        <Select value={deviceGroupId} onValueChange={setDeviceGroupId}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select device group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Device Groups</SelectItem>
                                                {filterOptions.deviceGroupIds.map((groupId) => (
                                                    <SelectItem key={groupId} value={groupId.toString()}>{groupId}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="start_date" className="text-xs">Start Date</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="end_date" className="text-xs">End Date</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button onClick={handleSearch} size="sm" className="flex-1">
                                        <Search className="mr-2 h-3 w-3" />
                                        Apply Filters
                                    </Button>
                                    <Button variant="outline" onClick={clearFilters} size="sm" className="flex-1">
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            USSD Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <button
                                                onClick={() => handleSort('created_at')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                Date
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden lg:table-cell">Session ID</TableHead>
                                        <TableHead>Device ID</TableHead>
                                        <TableHead>USSD Code</TableHead>
                                        <TableHead>Response</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">
                                            <button
                                                onClick={() => handleSort('sent_at')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                Sent/Received
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden xl:table-cell">Device Group</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ussdLogs.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(item.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="text-xs font-mono text-muted-foreground">{item.session_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-mono">{item.device_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-mono">{item.ussd_code}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <div className="text-xs">{truncateMessage(item.response_message, 40)}</div>
                                                    {item.error_message && (
                                                        <div className="text-xs text-red-500 mt-1">
                                                            Error: {truncateMessage(item.error_message, 30)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(item.status)}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="text-xs">
                                                    <div>Sent: {item.sent_at ? new Date(item.sent_at).toLocaleString() : 'N/A'}</div>
                                                    <div className="text-muted-foreground">Received: {item.received_at ? new Date(item.received_at).toLocaleString() : 'N/A'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                <div className="text-xs">
                                                    {item.device_group_id || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/ussd-logs/${item.id}`}>
                                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {ussdLogs.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((ussdLogs.current_page - 1) * ussdLogs.per_page) + 1} to{' '}
                                    {Math.min(ussdLogs.current_page * ussdLogs.per_page, ussdLogs.total)} of{' '}
                                    {ussdLogs.total} results
                                </div>
                                <div className="flex gap-1">
                                    {ussdLogs.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'hover:bg-muted hover:text-foreground'
                                            } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 