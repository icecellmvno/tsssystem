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
import { Search, Filter, ArrowUpDown, AlertTriangle, Calendar, Clock, Smartphone, Settings } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Alarm Logs',
        href: '/alarm-logs',
    },
];

interface AlarmLogItem {
    id: number;
    alarm_type: string;
    device_id: string;
    device_group_name: string;
    device_sitename: string;
    sim_slot: number;
    details: string;
    alarm_start: string;
    alarm_stop: number;
    created_at: string;
    updated_at: string;
    alarm_status: string;
    alarm_status_badge_variant: string;
    alarm_type_badge_variant: string;
    formatted_alarm_stop: string;
    formatted_duration: string;
}

interface PaginatedData {
    data: AlarmLogItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface Props {
    alarmLogs: PaginatedData;
    filters: {
        search: string;
        alarm_type: string;
        device_group_name: string;
        device_sitename: string;
        sim_slot: string;
        alarm_status: string;
        start_date: string;
        end_date: string;
        sort_by: string;
        sort_order: string;
    };
    filterOptions: {
        alarmTypes: string[];
        deviceGroupNames: string[];
        deviceSitenames: string[];
        simSlots: number[];
    };
}

export default function AlarmLogsIndex({ alarmLogs, filters, filterOptions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [alarmType, setAlarmType] = useState(filters.alarm_type || 'all');
    const [deviceGroupName, setDeviceGroupName] = useState(filters.device_group_name || 'all');
    const [deviceSitename, setDeviceSitename] = useState(filters.device_sitename || 'all');
    const [simSlot, setSimSlot] = useState(filters.sim_slot || 'all');
    const [alarmStatus, setAlarmStatus] = useState(filters.alarm_status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'alarm_start');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleSearch = () => {
        router.get('/alarm-logs', {
            search,
            alarm_type: alarmType,
            device_group_name: deviceGroupName,
            device_sitename: deviceSitename,
            sim_slot: simSlot,
            alarm_status: alarmStatus,
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
        router.get('/alarm-logs', {
            search,
            alarm_type: alarmType,
            device_group_name: deviceGroupName,
            device_sitename: deviceSitename,
            sim_slot: simSlot,
            alarm_status: alarmStatus,
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
        setAlarmType('all');
        setDeviceGroupName('all');
        setDeviceSitename('all');
        setSimSlot('all');
        setAlarmStatus('all');
        setStartDate('');
        setEndDate('');
        setSortBy('alarm_start');
        setSortOrder('desc');
        router.get('/alarm-logs', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const truncateDetails = (details: string, maxLength: number = 40) => {
        if (details.length <= maxLength) return details;
        return details.substring(0, maxLength) + '...';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Alarm Logs" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Alarm Logs</h1>
                        <p className="text-muted-foreground">
                            Total records: {alarmLogs.total}
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by device, group, sitename, details, or alarm type..."
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
                                <SheetTitle>Filter Alarm Logs</SheetTitle>
                                <SheetDescription>
                                    Apply filters to narrow down your search results.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-3 mt-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="alarm_type" className="text-xs">Alarm Type</Label>
                                        <Select value={alarmType} onValueChange={setAlarmType}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select alarm type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Alarm Types</SelectItem>
                                                {filterOptions.alarmTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="device_group_name" className="text-xs">Device Group</Label>
                                        <Select value={deviceGroupName} onValueChange={setDeviceGroupName}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select device group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Device Groups</SelectItem>
                                                {filterOptions.deviceGroupNames.map((group) => (
                                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="device_sitename" className="text-xs">Device Sitename</Label>
                                        <Select value={deviceSitename} onValueChange={setDeviceSitename}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select device sitename" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Device Sitenames</SelectItem>
                                                {filterOptions.deviceSitenames.map((sitename) => (
                                                    <SelectItem key={sitename} value={sitename}>{sitename}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="sim_slot" className="text-xs">SIM Slot</Label>
                                        <Select value={simSlot} onValueChange={setSimSlot}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select SIM slot" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All SIM Slots</SelectItem>
                                                {filterOptions.simSlots.map((slot) => (
                                                    <SelectItem key={slot} value={slot.toString()}>Slot {slot}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="alarm_status" className="text-xs">Alarm Status</Label>
                                        <Select value={alarmStatus} onValueChange={setAlarmStatus}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select alarm status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
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
                            <AlertTriangle className="h-5 w-5" />
                            Alarm Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <button
                                                onClick={() => handleSort('alarm_start')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                Start Time
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead>Device Info</TableHead>
                                        <TableHead>Alarm Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="hidden lg:table-cell">Duration</TableHead>
                                        <TableHead className="hidden md:table-cell">SIM Slot</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alarmLogs.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(item.alarm_start).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs font-mono">{item.device_id}</div>
                                                    <div className="text-xs text-muted-foreground">{item.device_group_name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.device_sitename}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.alarm_type_badge_variant}>
                                                    {item.alarm_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.alarm_status_badge_variant}>
                                                    {item.alarm_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <div className="text-xs">{truncateDetails(item.details, 40)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="text-xs">
                                                    {item.formatted_duration}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="text-xs">
                                                    Slot {item.sim_slot}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/alarm-logs/${item.id}`}>
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
                        {alarmLogs.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((alarmLogs.current_page - 1) * alarmLogs.per_page) + 1} to{' '}
                                    {Math.min(alarmLogs.current_page * alarmLogs.per_page, alarmLogs.total)} of{' '}
                                    {alarmLogs.total} results
                                </div>
                                <div className="flex gap-1">
                                    {alarmLogs.links.map((link, index) => (
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