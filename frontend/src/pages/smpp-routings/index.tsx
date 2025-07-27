import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { Search, Plus, ArrowUpDown, Settings, Route, Edit, Trash2, Eye } from 'lucide-react';
import { smsRoutingsService, type SmsRoutingItem, type SmsRoutingsListResponse } from '@/services/sms-routings';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'SMPP Routings',
        href: '/smpp-routings',
    },
];

export default function SmppRoutingsIndex() {
    const navigate = useNavigate();
    const [routings, setRoutings] = useState<SmsRoutingsListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [search, setSearch] = useState('');
    const [sourceType, setSourceType] = useState('all');
    const [direction, setDirection] = useState('all');
    const [targetType, setTargetType] = useState('all');
    const [isActive, setIsActive] = useState('all');
    const [sortBy, setSortBy] = useState('priority');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch routings
    const fetchRoutings = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                search: search || undefined,
                source_type: sourceType !== 'all' ? sourceType : undefined,
                direction: direction !== 'all' ? direction : undefined,
                target_type: targetType !== 'all' ? targetType : undefined,
                is_active: isActive !== 'all' ? isActive : undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            const response = await smsRoutingsService.getAll(params);
            setRoutings(response);
        } catch (error) {
            console.error('Error fetching SMS routings:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch SMS routings');
            toast.error('Failed to fetch SMS routings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutings();
    }, [search, sourceType, direction, targetType, isActive, sortBy, sortOrder]);

    const handleSearch = () => {
        fetchRoutings();
    };

    const handleSort = (field: string) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
    };

    const clearFilters = () => {
        setSearch('');
        setSourceType('all');
        setDirection('all');
        setTargetType('all');
        setIsActive('all');
        setSortBy('priority');
        setSortOrder('desc');
    };

    const handleDelete = async (routing: SmsRoutingItem) => {
        if (confirm(`Are you sure you want to delete "${routing.name}"?`)) {
            try {
                await smsRoutingsService.delete(routing.id);
                toast.success('SMS routing deleted successfully');
                fetchRoutings();
            } catch (error) {
                console.error('Error deleting SMS routing:', error);
                toast.error('Failed to delete SMS routing');
            }
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading SMS routings...</p>
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
                        <p className="text-destructive">Error loading SMS routings: {error}</p>
                        <Button onClick={fetchRoutings} className="mt-4">
                            Retry
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SMPP Routings</h1>
                        <p className="text-muted-foreground">
                            Total records: {routings?.meta.total || 0}
                        </p>
                    </div>
                    <Button onClick={() => navigate('/smpp-routings/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Routing
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-64">
                        <Input
                            placeholder="Search by name, description, or addresses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Select value={sourceType} onValueChange={setSourceType}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            <SelectItem value="smpp">SMPP</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={direction} onValueChange={setDirection}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Direction" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Directions</SelectItem>
                            <SelectItem value="inbound">Inbound</SelectItem>
                            <SelectItem value="outbound">Outbound</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={targetType} onValueChange={setTargetType}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Target" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Targets</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="device_group">Device Group</SelectItem>
                            <SelectItem value="smpp">SMPP</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={isActive} onValueChange={setIsActive}>
                        <SelectTrigger className="w-24">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleSearch}>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                        Clear
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Route className="h-5 w-5" />
                            SMPP Routings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <button
                                                onClick={() => handleSort('name')}
                                                className="flex items-center gap-1 hover:text-primary text-xs"
                                            >
                                                Name
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Direction</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden lg:table-cell">Summary</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {routings?.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.description}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant={item.source_type_badge_variant} className="text-xs">
                                                        {item.source_type.toUpperCase()}
                                                    </Badge>
                                                    {item.system_id && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.system_id}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.direction_badge_variant} className="text-xs">
                                                    {item.direction}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    {item.destination_address || <span className="text-muted-foreground">N/A</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant={item.target_type_badge_variant} className="text-xs">
                                                        {item.target_type.replace('_', ' ')}
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.target_display_name}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {item.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.status_badge_variant} className="text-xs">
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="text-xs text-muted-foreground max-w-48 truncate">
                                                    {item.routing_summary}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => navigate(`/smpp-routings/${item.id}`)}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => navigate(`/smpp-routings/${item.id}/edit`)}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(item)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {routings && routings.meta.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((routings.meta.current_page - 1) * routings.meta.per_page) + 1} to{' '}
                                    {Math.min(routings.meta.current_page * routings.meta.per_page, routings.meta.total)} of{' '}
                                    {routings.meta.total} results
                                </div>
                                <div className="flex gap-1">
                                    {Array.from({ length: routings.meta.last_page }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => {
                                                // TODO: Implement pagination
                                            }}
                                            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                                                page === routings.meta.current_page
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            {page}
                                        </button>
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