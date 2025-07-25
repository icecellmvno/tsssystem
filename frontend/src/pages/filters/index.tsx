import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { Search, Filter, ArrowUpDown, Plus, Eye, Edit, Trash2, Route, Calendar, Clock, Tag, Code, User, Users, MessageSquare, Database } from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Filters',
        href: '/filters',
    },
];

interface FilterItem {
    id: number;
    name: string;
    type: string;
    description: string;
    routes: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: FilterItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

const filterTypes = [
    { value: 'TransparentFilter', label: 'Transparent Filter', icon: Filter, description: 'Always matches any message criteria', routes: 'All' },
    { value: 'ConnectorFilter', label: 'Connector Filter', icon: Route, description: 'Matches the source connector of a message', routes: 'MO' },
    { value: 'UserFilter', label: 'User Filter', icon: User, description: 'Matches the owner of a MT message', routes: 'MT' },
    { value: 'GroupFilter', label: 'Group Filter', icon: Users, description: 'Matches the owner\'s group of a MT message', routes: 'MT' },
    { value: 'SourceAddrFilter', label: 'Source Address Filter', icon: MessageSquare, description: 'Matches the source address of a MO message', routes: 'All' },
    { value: 'DestinationAddrFilter', label: 'Destination Address Filter', icon: MessageSquare, description: 'Matches the destination address of a MT message', routes: 'All' },
    { value: 'ShortMessageFilter', label: 'Short Message Filter', icon: MessageSquare, description: 'Matches the content of a message', routes: 'All' },
    { value: 'DateIntervalFilter', label: 'Date Interval Filter', icon: Calendar, description: 'Matches the date of a message', routes: 'All' },
    { value: 'TimeIntervalFilter', label: 'Time Interval Filter', icon: Clock, description: 'Matches the time of a message', routes: 'All' },
    { value: 'TagFilter', label: 'Tag Filter', icon: Tag, description: 'Checks if message has a defined tag', routes: 'All' },
    { value: 'EvalPyFilter', label: 'Python Script Filter', icon: Code, description: 'Passes message to a third party python script for user-defined filtering', routes: 'All' },
];

export default function FiltersIndex() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { token } = useAuthStore();
    
    const [filters, setFilters] = useState<PaginatedData>({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        links: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');
    const [sortOrder, setSortOrder] = useState(searchParams.get('sort_order') || 'desc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Fetch filters
    useEffect(() => {
        const fetchFilters = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, any> = {};
                if (search) params.search = search;
                if (type && type !== 'all') params.type = type;
                if (sortBy) params.sort_by = sortBy;
                if (sortOrder) params.sort_order = sortOrder;
                
                const data = await apiClient.get<PaginatedData>('/filters', params);
                setFilters(data);
            } catch (error) {
                console.error('Error fetching filters:', error);
                toast.error('Failed to fetch filters');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilters();
    }, [search, type, sortBy, sortOrder]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (type && type !== 'all') params.set('type', type);
        if (sortBy) params.set('sort_by', sortBy);
        if (sortOrder) params.set('sort_order', sortOrder);
        setSearchParams(params);
    };

    const handleSort = (field: string) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
    };

    const clearFilters = () => {
        setSearch('');
        setType('all');
        setSortBy('created_at');
        setSortOrder('desc');
        setSearchParams({});
    };

    const deleteFilter = (id: number) => {
        // Implementation for deleting a filter
        toast.error('Delete functionality not implemented yet');
    };

    const confirmDelete = async () => {
        // Implementation for bulk delete
        toast.error('Bulk delete functionality not implemented yet');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFilterTypeInfo = (type: string) => {
        return filterTypes.find(ft => ft.value === type) || {
            label: type,
            icon: Filter,
            description: 'Unknown filter type',
            routes: 'Unknown'
        };
    };

    const getRouteBadgeVariant = (routes: string) => {
        switch (routes) {
            case 'All':
                return 'default';
            case 'MO':
                return 'secondary';
            case 'MT':
                return 'outline';
            default:
                return 'default';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Filters</h1>
                        <p className="text-muted-foreground">
                            Manage message routing filters
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/filters/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Filter
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2 flex-1">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search filters..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="max-w-sm"
                                />
                            </div>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {filterTypes.map((filterType) => (
                                        <SelectItem key={filterType.value} value={filterType.value}>
                                            {filterType.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={handleSearch}>
                                Search
                            </Button>
                            <Button variant="ghost" onClick={clearFilters}>
                                Clear
                            </Button>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={(e) => setSelectAll(e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('name')}
                                                className="h-auto p-0 font-semibold"
                                            >
                                                Name
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Routes</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('created_at')}
                                                className="h-auto p-0 font-semibold"
                                            >
                                                Created
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="w-24">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                Loading filters...
                                            </TableCell>
                                        </TableRow>
                                    ) : !filters.data || filters.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                No filters found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (filters.data || []).map((filter) => {
                                            const typeInfo = getFilterTypeInfo(filter.type);
                                            const IconComponent = typeInfo.icon;
                                            
                                            return (
                                                <TableRow key={filter.id}>
                                                    <TableCell>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(filter.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedIds([...selectedIds, filter.id]);
                                                                } else {
                                                                    setSelectedIds(selectedIds.filter(id => id !== filter.id));
                                                                }
                                                            }}
                                                            className="rounded border-gray-300"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{filter.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <IconComponent className="h-4 w-4" />
                                                            <span>{typeInfo.label}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getRouteBadgeVariant(typeInfo.routes)}>
                                                            {typeInfo.routes}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {typeInfo.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={filter.is_active ? 'default' : 'secondary'}>
                                                            {filter.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatDate(filter.created_at)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Link to={`/filters/${filter.id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link to={`/filters/${filter.id}/edit`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteFilter(filter.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {filters.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((filters.current_page - 1) * filters.per_page) + 1} to{' '}
                                    {Math.min(filters.current_page * filters.per_page, filters.total)} of{' '}
                                    {filters.total} results
                                </div>
                                <div className="flex items-center gap-2">
                                    {filters.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    const page = url.searchParams.get('page');
                                                    if (page) {
                                                        const params = new URLSearchParams(searchParams);
                                                        params.set('page', page);
                                                        setSearchParams(params);
                                                    }
                                                }
                                            }}
                                        >
                                            {link.label}
                                        </Button>
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