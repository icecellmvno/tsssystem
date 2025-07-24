import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { Search, Plus, ArrowUpDown, Settings, Route, Edit, Trash2, Eye } from 'lucide-react';

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

interface SmppRoutingItem {
    id: number;
    name: string;
    description: string;
    source_type: 'smpp' | 'http';
    direction: 'inbound' | 'outbound';
    system_id: string | null;
    destination_address: string | null;
    target_type: 'http' | 'device_group' | 'smpp';
    target_url: string | null;
    device_group_id: number | null;
    is_active: boolean;
    priority: number;
    conditions: any;
    created_at: string;
    updated_at: string;
    status_badge_variant: "default" | "secondary" | "destructive" | "outline";
    source_type_badge_variant: "default" | "secondary" | "destructive" | "outline";
    direction_badge_variant: "default" | "secondary" | "destructive" | "outline";
    target_type_badge_variant: "default" | "secondary" | "destructive" | "outline";
    source_display_name: string;
    target_display_name: string;
    routing_summary: string;
    device_group?: { id: number; name: string };
}

interface PaginatedData {
    data: SmppRoutingItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface Props {
    routings: PaginatedData;
    filters: {
        search: string;
        source_type: string;
        direction: string;
        target_type: string;
        is_active: string;
        sort_by: string;
        sort_order: string;
    };
    deviceGroups: Array<{ id: number; name: string; queue_name: string | null }>;
    smppUsers: string[];
    smppClients: string[];
}

export default function SmppRoutingsIndex({ routings, filters, deviceGroups, smppUsers, smppClients }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [sourceType, setSourceType] = useState(filters.source_type || 'all');
    const [direction, setDirection] = useState(filters.direction || 'all');
    const [targetType, setTargetType] = useState(filters.target_type || 'all');
    const [isActive, setIsActive] = useState(filters.is_active || 'all');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'priority');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleSearch = () => {
        router.get('/smpp-routings', {
            search,
            source_type: sourceType,
            direction,
            target_type: targetType,
            is_active: isActive,
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
        router.get('/smpp-routings', {
            search,
            source_type: sourceType,
            direction,
            target_type: targetType,
            is_active: isActive,
            sort_by: field,
            sort_order: newOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setSourceType('all');
        setDirection('all');
        setTargetType('all');
        setIsActive('all');
        setSortBy('priority');
        setSortOrder('desc');
        router.get('/smpp-routings', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (routing: SmppRoutingItem) => {
        if (confirm(`Are you sure you want to delete "${routing.name}"?`)) {
            router.delete(`/smpp-routings/${routing.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SMPP Routings" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SMPP Routings</h1>
                        <p className="text-muted-foreground">
                            Total records: {routings.total}
                        </p>
                    </div>
                    <Button onClick={() => router.get('/smpp-routings/create')}>
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
                                    {routings.data.map((item) => (
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
                                                        onClick={() => router.get(`/smpp-routings/${item.id}`)}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => router.get(`/smpp-routings/${item.id}/edit`)}
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
                        {routings.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((routings.current_page - 1) * routings.per_page) + 1} to{' '}
                                    {Math.min(routings.current_page * routings.per_page, routings.total)} of{' '}
                                    {routings.total} results
                                </div>
                                <div className="flex gap-1">
                                    {routings.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => router.get(link.url)}
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