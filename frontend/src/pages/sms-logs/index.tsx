import React, { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type BreadcrumbItem } from '@/types';
import { Search, Filter, ArrowUpDown, MessageSquare, Calendar as CalendarIcon, Phone, Hash, Settings, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/contexts/websocket-context';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'SMS Logs',
        href: '/sms-logs',
    },
];

interface SmsLogItem {
    id: number;
    message_id: string;
    msg_id: string | null;
    operator_msg_id: string | null;
    uid: string | null;
    correlation_id: string | null;
    device_id: string | null;
    device_name: string | null;
    device_imei: string | null;
    device_imsi: string | null;
    simcard_name: string | null;
    sim_slot: number | null;
    simcard_number: string | null;
    simcard_iccid: string | null;
    device_group_id: number | null;
    device_group: string | null;
    country_site_id: number | null;
    country_site: string | null;
    source_addr: string | null;
    source_username: string | null;
    destination_addr: string | null;
    message: string | null;
    message_length: number;
    message_encoding: string | null;
    direction: 'inbound' | 'outbound';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'timeout' | 'guard' | 'rejected' | 'expired' | 'cancelled' | 'submitted' | 'accepted' | 'undeliverable' | 'unknown';
    status_code: string | null;
    retry_count: number;
    max_retries: number;
    queued_at: string | null;
    sent_at: string | null;
    delivered_at: string | null;
    expires_at: string | null;
    processed_at: string | null;
    smpp_user_id: number | null;
    smpp_sent: boolean;
    operator_name: string | null;
    operator_code: string | null;
    mcc: string | null;
    mnc: string | null;
    rate: string;
    charge: string;
    currency: string;
    pdu_count: number;
    total_cost: string;
    error_message: string | null;
    error_code: string | null;
    delivery_report_requested: boolean;
    delivery_report_received_at: string | null;
    delivery_report_status: string | null;
    processing_time_ms: number | null;
    queue_time_ms: number | null;
    is_blacklisted: boolean;
    campaign_id: string | null;
    batch_id: string | null;
    metadata: any | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: SmsLogItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface Props {
    smsLogs: PaginatedData;
    filters: {
        search: string;
        status: string;
        smpp_sent: string;
        source_addr: string;
        destination_addr: string;
        device_id: string;
        device_name: string;
        simcard_name: string;
        sim_slot: string;
        start_date: string;
        end_date: string;
        sort_by: string;
        sort_order: string;
    };
    filterOptions: {
        statuses: string[];
        deviceNames: string[];
        simcardNames: string[];
        simSlots: number[];
    };
}

export default function SmsLogsIndex() {
  const { token, isAuthenticated } = useAuthStore();
  const ws = useWebSocket();
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    smpp_sent: '',
    source_addr: '',
    destination_addr: '',
    device_id: '',
    device_name: '',
    simcard_name: '',
    sim_slot: '',
            country_site: '',
    device_group: '',
    source_username: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    deviceNames: [],
    simcardNames: [],
    simSlots: [],
            countrySites: [],
    deviceGroups: [],
    sourceUsernames: []
  });

  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(), // Today
  });

  // Handle date range selection
  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      window.location.href = '/login';
      return;
    }
  }, [isAuthenticated, token]);

  // Fetch SMS logs
  const fetchSmsLogs = async () => {
    if (!isAuthenticated || !token) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...filters
      });

      // Add date range to query params
      if (dateRange.from) {
        queryParams.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        queryParams.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const response = await fetch(`/api/sms-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSmsLogs(data.data || []);
        setTotal(data.total || 0);
        setLastPage(data.last_page || 1);
        setCurrentPage(data.current_page || 1);
      } else {
        toast.error('Failed to fetch SMS logs');
      }
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast.error('Failed to fetch SMS logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch('/api/sms-logs/filter-options', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSmsLogs();
    fetchFilterOptions();
  }, [currentPage, perPage, filters, dateRange]);

  // Update SMS logs with WebSocket real-time data
  useEffect(() => {
    // This will be implemented when WebSocket SMS log updates are available
  }, [ws.devices]);

    const handleSearch = () => {
        fetchSmsLogs();
    };

    const handleSort = (field: string) => {
        setFilters(prev => ({
            ...prev,
            sort_by: field,
            sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            smpp_sent: '',
            source_addr: '',
            destination_addr: '',
            device_id: '',
            device_name: '',
            simcard_name: '',
            sim_slot: '',
            country_site: '',
            device_group: '',
            source_username: '',
            sort_by: 'created_at',
            sort_order: 'desc'
        });
        setDateRange({
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            to: new Date(), // Today
        });
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'default';
            case 'failed':
            case 'rejected':
            case 'expired':
            case 'undeliverable':
                return 'destructive';
            case 'pending':
            case 'queued':
                return 'secondary';
            case 'sent':
            case 'submitted':
            case 'accepted':
                return 'outline';
            case 'timeout':
            case 'guard':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getDirectionBadgeVariant = (direction: string) => {
        return direction === 'inbound' ? 'default' : 'outline';
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'destructive';
            case 'high':
                return 'default';
            case 'normal':
                return 'outline';
            case 'low':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const truncateMessage = (message: string | null | undefined, maxLength: number = 50) => {
        if (!message) return 'N/A';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    const getMetadataValue = (metadata: any, key: string) => {
        if (!metadata || typeof metadata !== 'object') return null;
        return metadata[key] || null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* <Head title="SMS Logs" /> */}
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 px-6 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SMS Logs</h1>
                        <p className="text-muted-foreground">
                            Total records: {total}
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by message ID, destination, source, message content, or device..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
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
                        <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                                <SheetTitle>Filter SMS Logs</SheetTitle>
                                <SheetDescription>
                                    Apply filters to narrow down your search results.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 mt-6 px-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                            <SelectTrigger>
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
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="source_addr" className="text-sm font-medium">Source Address</Label>
                                        <Input
                                            id="source_addr"
                                            placeholder="Enter source address"
                                            value={filters.source_addr}
                                            onChange={(e) => handleFilterChange('source_addr', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="destination_addr" className="text-sm font-medium">Destination Address</Label>
                                        <Input
                                            id="destination_addr"
                                            placeholder="Enter destination address"
                                            value={filters.destination_addr}
                                            onChange={(e) => handleFilterChange('destination_addr', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="device_id" className="text-sm font-medium">Device ID</Label>
                                        <Input
                                            id="device_id"
                                            placeholder="Enter device ID"
                                            value={filters.device_id}
                                            onChange={(e) => handleFilterChange('device_id', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="device_name" className="text-sm font-medium">Device Name</Label>
                                        <Select value={filters.device_name} onValueChange={(value) => handleFilterChange('device_name', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select device name" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Devices</SelectItem>
                                                {filterOptions.deviceNames.map((name) => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="simcard_name" className="text-sm font-medium">SIM Card Name</Label>
                                        <Select value={filters.simcard_name} onValueChange={(value) => handleFilterChange('simcard_name', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select SIM card name" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All SIM Cards</SelectItem>
                                                {filterOptions.simcardNames.map((name) => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="sim_slot" className="text-sm font-medium">SIM Slot</Label>
                                        <Select value={filters.sim_slot} onValueChange={(value) => handleFilterChange('sim_slot', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select SIM slot" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All slots</SelectItem>
                                                {filterOptions.simSlots.map((slot) => (
                                                    <SelectItem key={slot} value={slot.toString()}>
                                                        Slot {slot}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                                                    <Label htmlFor="country_site" className="text-sm font-medium">Country Site</Label>
                            <Select value={filters.country_site} onValueChange={(value) => handleFilterChange('country_site', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country site" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All country sites</SelectItem>
                                    {filterOptions.countrySites.map((countrySite) => (
                                        <SelectItem key={countrySite} value={countrySite}>
                                            {countrySite}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="device_group" className="text-sm font-medium">Device Group</Label>
                                        <Select value={filters.device_group} onValueChange={(value) => handleFilterChange('device_group', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select device group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All device groups</SelectItem>
                                                {filterOptions.deviceGroups.map((group) => (
                                                    <SelectItem key={group} value={group}>
                                                        {group}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="source_username" className="text-sm font-medium">Source Username</Label>
                                        <Select value={filters.source_username} onValueChange={(value) => handleFilterChange('source_username', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select source username" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All usernames</SelectItem>
                                                {filterOptions.sourceUsernames.map((username) => (
                                                    <SelectItem key={username} value={username}>
                                                        {username}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="smpp_sent" className="text-sm font-medium">SMPP Sent</Label>
                                        <Select value={filters.smpp_sent} onValueChange={(value) => handleFilterChange('smpp_sent', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select SMPP status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="true">Sent</SelectItem>
                                                <SelectItem value="false">Not Sent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Date Range</Label>
                                        <div className="grid gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                      id="date"
                                                      variant={"outline"}
                                                      className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !dateRange.from && "text-muted-foreground"
                                                      )}
                                                    >
                                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                                      {dateRange.from ? (
                                                        dateRange.to ? (
                                                          <>
                                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                                            {format(dateRange.to, "LLL dd, y")}
                                                          </>
                                                        ) : (
                                                          format(dateRange.from, "LLL dd, y")
                                                        )
                                                      ) : (
                                                        <span>Pick a date range</span>
                                                      )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={dateRange.from}
                                                    selected={dateRange}
                                                    onSelect={handleDateRangeSelect}
                                                    numberOfMonths={2}
                                                  />
                                                </PopoverContent>
                                            </Popover>
                                            
                                            {/* Quick date range buttons */}
                                            <div className="flex flex-wrap gap-1">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setDateRange({
                                                    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
                                                    to: new Date()
                                                  })}
                                                  className="text-xs"
                                                >
                                                  Today
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setDateRange({
                                                    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                                                    to: new Date()
                                                  })}
                                                  className="text-xs"
                                                >
                                                  Last 7 days
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setDateRange({
                                                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                                    to: new Date()
                                                  })}
                                                  className="text-xs"
                                                >
                                                  Last 30 days
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setDateRange({
                                                    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                                                    to: new Date()
                                                  })}
                                                  className="text-xs"
                                                >
                                                  Last 90 days
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button onClick={handleSearch} className="flex-1">
                                        <Search className="mr-2 h-4 w-4" />
                                        Apply Filters
                                    </Button>
                                    <Button variant="outline" onClick={clearFilters} className="flex-1">
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
                            SMS Logs
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
                                        <TableHead className="hidden lg:table-cell">Message ID</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead className="hidden md:table-cell">Destination</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">
                                            <button
                                                onClick={() => handleSort('rate')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                Cost
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden lg:table-cell">Device</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {smsLogs.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div className="space-y-1">
                                                    <div>{new Date(item.created_at).toLocaleString()}</div>
                                                    {item.sent_at && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Sent: {new Date(item.sent_at).toLocaleTimeString()}
                                                        </div>
                                                    )}
                                                    {item.delivered_at && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Delivered: {new Date(item.delivered_at).toLocaleTimeString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-mono text-muted-foreground">ID: {item.message_id}</div>
                                                    {item.msg_id && (
                                                        <div className="text-xs font-mono text-muted-foreground">Msg: {item.msg_id}</div>
                                                    )}
                                                    {item.operator_msg_id && (
                                                        <div className="text-xs font-mono text-muted-foreground">Op: {item.operator_msg_id}</div>
                                                    )}
                                                    {item.uid && (
                                                        <div className="text-xs font-mono text-muted-foreground">UID: {item.uid}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs font-mono">{item.source_addr}</div>
                                                    <div className="text-xs text-muted-foreground">{item.operator_name || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{item.operator_code || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.mcc && item.mnc ? `${item.mcc}-${item.mnc}` : 'N/A'}
                                                    </div>
                                                    
                                                    {/* Device Bilgileri - Küçük ekranlarda da görünsün */}
                                                    <div className="text-xs text-blue-600 font-medium mt-1">
                                                        📱 {item.device_name || item.device_id || 'N/A'}
                                                    </div>
                                                    {item.simcard_name && (
                                                        <div className="text-xs text-green-600">
                                                            📞 {item.simcard_name}
                                                        </div>
                                                    )}
                                                    {item.sim_slot && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Slot: {item.sim_slot}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Metadata'dan ek bilgiler */}
                                                    {getMetadataValue(item.metadata, 'source_connector') && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Connector: {getMetadataValue(item.metadata, 'source_connector')}
                                                        </div>
                                                    )}
                                                    {getMetadataValue(item.metadata, 'source_username') && (
                                                        <div className="text-xs text-muted-foreground">
                                                            User: {getMetadataValue(item.metadata, 'source_username')}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="text-xs font-mono">{item.destination_addr}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <div className="text-xs">{truncateMessage(item.message, 40)}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        <div>Length: {item.message_length} | PDU: {item.pdu_count}</div>
                                                        <div>Retries: {item.retry_count}/{item.max_retries}</div>
                                                        <div>Encoding: {item.message_encoding || 'N/A'}</div>
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        <Badge variant={getDirectionBadgeVariant(item.direction)}>
                                                            {item.direction}
                                                        </Badge>
                                                        <Badge variant={getPriorityBadgeVariant(item.priority)}>
                                                            {item.priority}
                                                        </Badge>
                                                        {item.delivery_report_requested && (
                                                            <Badge variant="outline">DR</Badge>
                                                        )}
                                                        {item.is_blacklisted && (
                                                            <Badge variant="destructive">BL</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant={getStatusBadgeVariant(item.status)}>
                                                        {item.status}
                                                    </Badge>
                                                    {item.status_code && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Code: {item.status_code}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.smpp_sent ? 'SMPP Sent' : 'Not Sent'}
                                                    </div>
                                                    {item.error_message && (
                                                        <div className="text-xs text-destructive">
                                                            {truncateMessage(item.error_message, 30)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="text-xs">
                                                    <div>Rate: ${item.rate}</div>
                                                    <div className="text-muted-foreground">Charge: ${item.charge}</div>
                                                    <div className="text-muted-foreground">Total: ${item.total_cost}</div>
                                                    <div className="text-muted-foreground">Currency: {item.currency}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1">
                                                    {/* Device Bilgileri */}
                                                    <div className="text-xs font-medium">{item.device_name || item.device_id || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">ID: {item.device_id || 'N/A'}</div>
                                                    {item.device_imei && (
                                                        <div className="text-xs text-muted-foreground">IMEI: {item.device_imei}</div>
                                                    )}
                                                    {item.device_imsi && (
                                                        <div className="text-xs text-muted-foreground">
                                                            IMSI: {item.device_imsi}
                                                        </div>
                                                    )}
                                                    {item.device_group && (
                                                        <div className="text-xs text-blue-600 font-medium">Group: {item.device_group}</div>
                                                    )}
                                                                        {item.country_site && (
                        <div className="text-xs text-green-600 font-medium">Site: {item.country_site}</div>
                    )}
                                                    
                                                    {/* SIM Card Bilgileri */}
                                                    {item.simcard_name && (
                                                        <div className="text-xs text-blue-600 font-medium">
                                                            📱 {item.simcard_name}
                                                        </div>
                                                    )}
                                                    {item.sim_slot && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Slot: {item.sim_slot}
                                                        </div>
                                                    )}
                                                    {item.simcard_number && (
                                                        <div className="text-xs text-muted-foreground">
                                                            📞 {item.simcard_number}
                                                        </div>
                                                    )}
                                                    {item.simcard_iccid && (
                                                        <div className="text-xs text-muted-foreground font-mono">
                                                            ICCID: {item.simcard_iccid.substring(0, 8)}...
                                                        </div>
                                                    )}
                                                    
                                                    {/* Source Username */}
                                                    {item.source_username && (
                                                        <div className="text-xs text-purple-600 font-medium">
                                                            User: {item.source_username}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Legacy metadata bilgileri */}
                                                    {getMetadataValue(item.metadata, 'device_imei') && (
                                                        <div className="text-xs text-muted-foreground">
                                                            IMEI: {getMetadataValue(item.metadata, 'device_imei')}
                                                        </div>
                                                    )}
                                                    {getMetadataValue(item.metadata, 'device_imsi') && (
                                                        <div className="text-xs text-muted-foreground">
                                                            IMSI: {getMetadataValue(item.metadata, 'device_imsi')}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/sms-logs/${item.id}`}>
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
                        {lastPage > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * perPage) + 1} to{' '}
                                    {Math.min(currentPage * perPage, total)} of{' '}
                                    {total} results
                                </div>
                                <div className="flex gap-1">
                                    {/* Inertia.js links are removed, so we'll just show current page and total pages */}
                                    <span className="px-3 py-2 text-sm rounded-md border border-muted-foreground">
                                        Page {currentPage} of {lastPage}
                                    </span>
                                    <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                        Previous
                                    </Button>
                                    <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === lastPage}>
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