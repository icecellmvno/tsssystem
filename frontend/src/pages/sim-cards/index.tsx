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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { type BreadcrumbItem } from '@/types';
import { Search, Filter, ArrowUpDown, Smartphone, Signal, Wifi, Globe, CreditCard, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'SIM Cards',
        href: '/sim-cards',
    },
];

interface SimCardItem {
    id: number;
    slot_index: number;
    subscription_id: number;
    display_name: string;
    carrier_name: string;
    country_iso: string;
    number: string;
    imei: string;
    iccid: string;
    imsi: string;
    network_mcc: string;
    network_mnc: string;
    sim_mcc: string;
    sim_mnc: string;
    network_operator_name: string;
    sim_operator_name: string;
    roaming: boolean;
    signal_strength: number;
    signal_dbm: number;
    signal_type: string;
    rsrp: number;
    rsrq: number;
    rssnr: number;
    cqi: number;
    network_type: string;
    is_active: boolean;
    total_delivered: number;
    total_sent: number;
    total_waiting: number;
    main_balance: number;
    sms_balance: number;
    sms_limit: number;
    device_id: number;
    device_name: string;
    sitename: string;
    device_group_name: string;
    created_at: string;
    updated_at: string;
    status_badge_variant: string;
    roaming_badge_variant: string;
    signal_strength_badge_variant: string;
    network_type_badge_variant: string;
    success_rate: number;
    formatted_main_balance: string;
    formatted_sms_balance: string;
    formatted_sms_limit: string;
    signal_strength_text: string;
}

interface PaginatedData {
    data: SimCardItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface Props {
    simCards: PaginatedData;
    filters: {
        search: string;
        slot_index: string;
        carrier_name: string;
        country_iso: string;
        network_operator_name: string;
        sim_operator_name: string;
        roaming: string;
        is_active: string;
        network_type: string;
        sitename: string;
        device_group_name: string;
        device_name: string;
        sms_status: string;
        sort_by: string;
        sort_order: string;
    };
    filterOptions: {
        slotIndexes: number[];
        carrierNames: string[];
        countryIsos: string[];
        networkOperators: string[];
        simOperators: string[];
        networkTypes: string[];
        sitenames: string[];
        deviceGroups: string[];
        deviceNames: string[];
    };
}

export default function SimCardsIndex({ simCards, filters, filterOptions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [slotIndex, setSlotIndex] = useState(filters.slot_index || 'all');
    const [carrierName, setCarrierName] = useState(filters.carrier_name || 'all');
    const [countryIso, setCountryIso] = useState(filters.country_iso || 'all');
    const [networkOperatorName, setNetworkOperatorName] = useState(filters.network_operator_name || 'all');
    const [simOperatorName, setSimOperatorName] = useState(filters.sim_operator_name || 'all');
    const [roaming, setRoaming] = useState(filters.roaming || 'all');
    const [isActive, setIsActive] = useState(filters.is_active || 'all');
    const [networkType, setNetworkType] = useState(filters.network_type || 'all');
    const [sitename, setSitename] = useState(filters.sitename || 'all');
    const [deviceGroupName, setDeviceGroupName] = useState(filters.device_group_name || 'all');
    const [deviceName, setDeviceName] = useState(filters.device_name || 'all');
    const [smsStatus, setSmsStatus] = useState(filters.sms_status || 'all');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'slot_index');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'asc');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const handleSearch = () => {
        router.get('/sim-cards', {
            search,
            slot_index: slotIndex,
            carrier_name: carrierName,
            country_iso: countryIso,
            network_operator_name: networkOperatorName,
            sim_operator_name: simOperatorName,
            roaming,
            is_active: isActive,
            network_type: networkType,
            sitename,
            device_group_name: deviceGroupName,
            device_name: deviceName,
            sms_status: smsStatus,
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
        router.get('/sim-cards', {
            search,
            slot_index: slotIndex,
            carrier_name: carrierName,
            country_iso: countryIso,
            network_operator_name: networkOperatorName,
            sim_operator_name: simOperatorName,
            roaming,
            is_active: isActive,
            network_type: networkType,
            sitename,
            device_group_name: deviceGroupName,
            device_name: deviceName,
            sms_status: smsStatus,
            sort_by: field,
            sort_order: newOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSlotIndex('all');
        setCarrierName('all');
        setCountryIso('all');
        setNetworkOperatorName('all');
        setSimOperatorName('all');
        setRoaming('all');
        setIsActive('all');
        setNetworkType('all');
        setSitename('all');
        setDeviceGroupName('all');
        setDeviceName('all');
        setSmsStatus('all');
        setSortBy('slot_index');
        setSortOrder('asc');
        router.get('/sim-cards', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id: number) => {
        setIsDeleting(id);
        router.delete(`/sim-cards/${id}`, {
            onSuccess: () => {
                setIsDeleting(null);
            },
            onError: () => {
                setIsDeleting(null);
            },
        });
    };

    const truncateText = (text: string, maxLength: number = 20) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SIM Cards" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SIM Cards</h1>
                        <p className="text-muted-foreground">
                            Total records: {simCards.total}
                        </p>
                    </div>
                </div>

                {/* SMS Statistics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Globe className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total SMS Sent</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {simCards.data.reduce((sum, card) => sum + card.total_sent, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Globe className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Delivered</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {simCards.data.reduce((sum, card) => sum + card.total_delivered, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Globe className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Waiting</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {simCards.data.reduce((sum, card) => sum + card.total_waiting, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Globe className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Avg Success Rate</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {(() => {
                                            const totalSent = simCards.data.reduce((sum, card) => sum + card.total_sent, 0);
                                            const totalDelivered = simCards.data.reduce((sum, card) => sum + card.total_delivered, 0);
                                            return totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
                                        })()}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by display name, carrier, number, IMEI, ICCID, IMSI, or operators..."
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
                                <SheetTitle>Filter SIM Cards</SheetTitle>
                                <SheetDescription>
                                    Apply filters to narrow down your search results.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-3 mt-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="slot_index" className="text-xs">Slot Index</Label>
                                        <Select value={slotIndex} onValueChange={setSlotIndex}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select slot index" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Slots</SelectItem>
                                                {filterOptions.slotIndexes.map((slot) => (
                                                    <SelectItem key={slot} value={slot.toString()}>Slot {slot}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="carrier_name" className="text-xs">Carrier Name</Label>
                                        <Select value={carrierName} onValueChange={setCarrierName}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select carrier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Carriers</SelectItem>
                                                {filterOptions.carrierNames.map((carrier) => (
                                                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="country_iso" className="text-xs">Country</Label>
                                        <Select value={countryIso} onValueChange={setCountryIso}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Countries</SelectItem>
                                                {filterOptions.countryIsos.map((country) => (
                                                    <SelectItem key={country} value={country}>{country}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="network_operator_name" className="text-xs">Network Operator</Label>
                                        <Select value={networkOperatorName} onValueChange={setNetworkOperatorName}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select network operator" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Network Operators</SelectItem>
                                                {filterOptions.networkOperators.map((operator) => (
                                                    <SelectItem key={operator} value={operator}>{operator}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="sim_operator_name" className="text-xs">SIM Operator</Label>
                                        <Select value={simOperatorName} onValueChange={setSimOperatorName}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select SIM operator" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All SIM Operators</SelectItem>
                                                {filterOptions.simOperators.map((operator) => (
                                                    <SelectItem key={operator} value={operator}>{operator}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="roaming" className="text-xs">Roaming Status</Label>
                                        <Select value={roaming} onValueChange={setRoaming}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select roaming status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="true">Roaming</SelectItem>
                                                <SelectItem value="false">Not Roaming</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="is_active" className="text-xs">Active Status</Label>
                                        <Select value={isActive} onValueChange={setIsActive}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select active status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="true">Active</SelectItem>
                                                <SelectItem value="false">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="network_type" className="text-xs">Network Type</Label>
                                        <Select value={networkType} onValueChange={setNetworkType}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select network type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Network Types</SelectItem>
                                                {filterOptions.networkTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="sitename" className="text-xs">Sitename</Label>
                                        <Select value={sitename} onValueChange={setSitename}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select sitename" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sitenames</SelectItem>
                                                {filterOptions.sitenames.map((site) => (
                                                    <SelectItem key={site} value={site}>{site}</SelectItem>
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
                                                {filterOptions.deviceGroups.map((group) => (
                                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="device_name" className="text-xs">Device Name</Label>
                                        <Select value={deviceName} onValueChange={setDeviceName}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select device name" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Device Names</SelectItem>
                                                {filterOptions.deviceNames.map((device) => (
                                                    <SelectItem key={device} value={device}>{device}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor="sms_status" className="text-xs">SMS Status</Label>
                                        <Select value={smsStatus} onValueChange={setSmsStatus}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select SMS status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="high_activity">High Activity (&gt;100 SMS)</SelectItem>
                                                <SelectItem value="medium_activity">Medium Activity (10-100 SMS)</SelectItem>
                                                <SelectItem value="low_activity">Low Activity (&lt;10 SMS)</SelectItem>
                                                <SelectItem value="no_activity">No Activity (0 SMS)</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                            <Smartphone className="h-5 w-5" />
                            SIM Cards
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <button
                                                onClick={() => handleSort('slot_index')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                Slot
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead>
                                            <button
                                                onClick={() => handleSort('total_sent')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                SMS Sent
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead>SIM Info</TableHead>
                                        <TableHead>Device Info</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">Signal</TableHead>
                                        <TableHead className="hidden md:table-cell">Balance</TableHead>
                                        <TableHead className="hidden xl:table-cell">SMS Stats</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {simCards.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs">
                                                Slot {item.slot_index}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">{item.total_sent.toLocaleString()}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.success_rate}%
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium">{item.display_name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.carrier_name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.number}</div>
                                                    <div className="text-xs font-mono text-muted-foreground">{truncateText(item.iccid, 15)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium">{item.device_name || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">ID: {item.device_id}</div>
                                                    <div className="text-xs text-muted-foreground">{item.sitename || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{item.device_group_name || 'N/A'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant={item.network_type_badge_variant as "default" | "destructive" | "secondary" | "outline"}>
                                                        {item.network_type}
                                                    </Badge>
                                                    <div className="text-xs">{item.network_operator_name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.country_iso}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant={item.status_badge_variant as "default" | "destructive" | "secondary" | "outline"}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {item.roaming && (
                                                        <Badge variant={item.roaming_badge_variant as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                                                            Roaming
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1">
                                                    <Badge variant={item.signal_strength_badge_variant as "default" | "destructive" | "secondary" | "outline"}>
                                                        {item.signal_strength_text}
                                                    </Badge>
                                                    <div className="text-xs">{item.signal_dbm} dBm</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="space-y-1">
                                                    <div className="text-xs">₺{item.formatted_main_balance}</div>
                                                    <div className="text-xs text-muted-foreground">{item.formatted_sms_balance} SMS</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-xs font-medium text-green-600">✓ {item.total_delivered}</div>
                                                        <div className="text-xs font-medium text-blue-600">→ {item.total_sent}</div>
                                                        <div className="text-xs font-medium text-yellow-600">⏳ {item.total_waiting}</div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Success Rate: <span className="font-medium">{item.success_rate}%</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/sim-cards/${item.id}`}>
                                                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                disabled={isDeleting === item.id}
                                                            >
                                                                {isDeleting === item.id ? (
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                                                ) : (
                                                                    <Trash2 className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete SIM Card</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this SIM card? This action cannot be undone.
                                                                    <br />
                                                                    <br />
                                                                    <strong>SIM Card Details:</strong>
                                                                    <br />
                                                                    • Display Name: {item.display_name}
                                                                    <br />
                                                                    • Carrier: {item.carrier_name}
                                                                    <br />
                                                                    • Number: {item.number}
                                                                    <br />
                                                                    • Slot: {item.slot_index}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {simCards.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((simCards.current_page - 1) * simCards.per_page) + 1} to{' '}
                                    {Math.min(simCards.current_page * simCards.per_page, simCards.total)} of{' '}
                                    {simCards.total} results
                                </div>
                                <div className="flex gap-1">
                                    {simCards.links.map((link, index) => (
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