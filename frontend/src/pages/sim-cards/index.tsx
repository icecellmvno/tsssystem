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
import { Search, Filter, ArrowUpDown, Smartphone, Plus, MoreHorizontal } from 'lucide-react';
import { simCardsService, type SimCard, type SimCardFilters, type SimCardFilterOptions } from '@/services/sim-cards';
import { toast } from 'sonner';

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

export default function SimCardsIndex() {
    const [simCards, setSimCards] = useState<SimCard[]>([]);
    const [filterOptions, setFilterOptions] = useState<SimCardFilterOptions>({
        slot_indexes: [],
        carrier_names: [],
        country_isos: [],
        network_operator_names: [],
        sim_operator_names: [],
        network_types: [],
        sitenames: [],
        device_group_names: [],
        device_names: [],
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<SimCardFilters>({
        page: 1,
        per_page: 15,
        search: '',
        slot_index: 'all',
        carrier_name: 'all',
        country_iso: 'all',
        network_operator_name: 'all',
        sim_operator_name: 'all',
        roaming: 'all',
        is_active: 'all',
        network_type: 'all',
        sitename: 'all',
        device_group_name: 'all',
        device_name: 'all',
        sms_status: 'all',
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

    // Fetch SIM cards and filter options
    const fetchData = async () => {
        try {
            setLoading(true);
            const [cardsResponse, optionsResponse] = await Promise.all([
                simCardsService.getSimCards(filters),
                simCardsService.getFilterOptions(),
            ]);
            
            setSimCards(cardsResponse.data);
            setPagination({
                current_page: cardsResponse.current_page,
                last_page: cardsResponse.last_page,
                per_page: cardsResponse.per_page,
                total: cardsResponse.total,
                from: cardsResponse.from,
                to: cardsResponse.to,
            });
            setFilterOptions(optionsResponse);
        } catch (error) {
            console.error('Error fetching SIM cards:', error);
            toast.error('Failed to fetch SIM cards');
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
            slot_index: 'all',
            carrier_name: 'all',
            country_iso: 'all',
            network_operator_name: 'all',
            sim_operator_name: 'all',
            roaming: 'all',
            is_active: 'all',
            network_type: 'all',
            sitename: 'all',
            device_group_name: 'all',
            device_name: 'all',
            sms_status: 'all',
            sort_by: 'created_at',
            sort_order: 'desc',
        });
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this SIM card?')) {
            return;
        }

        try {
            await simCardsService.deleteSimCard(id);
            toast.success('SIM card deleted successfully');
            fetchData(); // Refresh the list
        } catch (error) {
            console.error('Error deleting SIM card:', error);
            toast.error('Failed to delete SIM card');
        }
    };

    const getStatusBadgeVariant = (isActive: boolean) => {
        return isActive ? 'default' : 'destructive';
    };

    const getRoamingBadgeVariant = (roaming: boolean) => {
        return roaming ? 'destructive' : 'default';
    };

    const getNetworkTypeBadgeVariant = (networkType: string) => {
        switch (networkType) {
            case '5G':
                return 'default';
            case '4G':
                return 'outline';
            case '3G':
                return 'secondary';
            case '2G':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading SIM cards...</p>
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
                        <h1 className="text-2xl font-bold tracking-tight">SIM Cards</h1>
                        <p className="text-muted-foreground">
                            Manage and monitor SIM card information and status
                        </p>
                    </div>
                    <Link to="/sim-cards/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add SIM Card
                        </Button>
                    </Link>
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
                                    placeholder="Search SIM cards..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slot_index">Slot Index</Label>
                                <Select value={filters.slot_index} onValueChange={(value) => setFilters(prev => ({ ...prev, slot_index: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select slot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Slots</SelectItem>
                                        {filterOptions.slot_indexes.map((slot) => (
                                            <SelectItem key={slot} value={slot.toString()}>
                                                Slot {slot}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="carrier_name">Carrier</Label>
                                <Select value={filters.carrier_name} onValueChange={(value) => setFilters(prev => ({ ...prev, carrier_name: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select carrier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Carriers</SelectItem>
                                        {filterOptions.carrier_names.map((carrier) => (
                                            <SelectItem key={carrier} value={carrier}>
                                                {carrier}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country_iso">Country</Label>
                                <Select value={filters.country_iso} onValueChange={(value) => setFilters(prev => ({ ...prev, country_iso: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Countries</SelectItem>
                                        {filterOptions.country_isos.map((country) => (
                                            <SelectItem key={country} value={country}>
                                                {country}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="network_operator_name">Network Operator</Label>
                                <Select value={filters.network_operator_name} onValueChange={(value) => setFilters(prev => ({ ...prev, network_operator_name: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Operators</SelectItem>
                                        {filterOptions.network_operator_names.map((operator) => (
                                            <SelectItem key={operator} value={operator}>
                                                {operator}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="network_type">Network Type</Label>
                                <Select value={filters.network_type} onValueChange={(value) => setFilters(prev => ({ ...prev, network_type: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select network type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {filterOptions.network_types.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="roaming">Roaming</Label>
                                <Select value={filters.roaming} onValueChange={(value) => setFilters(prev => ({ ...prev, roaming: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select roaming status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Roaming</SelectItem>
                                        <SelectItem value="false">Not Roaming</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="is_active">Status</Label>
                                <Select value={filters.is_active} onValueChange={(value) => setFilters(prev => ({ ...prev, is_active: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
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
                        <CardTitle>SIM Cards ({pagination.total} total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {simCards.length === 0 ? (
                            <div className="text-center py-8">
                                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No SIM cards found</p>
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
                                            <TableHead>Slot</TableHead>
                                            <TableHead>
                                                <Button variant="ghost" onClick={() => handleSort('carrier_name')}>
                                                    Carrier
                                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Network</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Roaming</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>SMS Stats</TableHead>
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
                                        {simCards.map((simCard) => (
                                            <TableRow key={simCard.id}>
                                                <TableCell>{simCard.id}</TableCell>
                                                <TableCell>Slot {simCard.slot_index}</TableCell>
                                                <TableCell>{simCard.carrier_name}</TableCell>
                                                <TableCell className="font-mono">{simCard.number}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getNetworkTypeBadgeVariant(simCard.network_type)}>
                                                        {simCard.network_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(simCard.is_active)}>
                                                        {simCard.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getRoamingBadgeVariant(simCard.roaming)}>
                                                        {simCard.roaming ? 'Roaming' : 'Local'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{simCard.formatted_main_balance}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <div>Sent: {simCard.total_sent}</div>
                                                        <div>Delivered: {simCard.total_delivered}</div>
                                                        <div>Success: {simCard.success_rate.toFixed(1)}%</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDate(simCard.created_at)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Link to={`/sim-cards/${simCard.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                        </Link>
                                                        <Link to={`/sim-cards/${simCard.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleDelete(simCard.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
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
