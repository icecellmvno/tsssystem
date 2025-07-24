import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'MCC-MNC List',
        href: '/mcc-mnc',
    },
];

interface MccMncItem {
    id: number;
    type: string;
    country_name: string;
    country_code: string;
    mcc: string;
    mnc: string;
    brand: string;
    operator: string;
    status: string;
    bands: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: MccMncItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface Props {
    mccMncList: PaginatedData;
    filters: {
        search: string;
        type: string;
        status: string;
        country_code: string;
        sort_by: string;
        sort_order: string;
    };
    filterOptions: {
        types: string[];
        statuses: string[];
        countries: Record<string, string>;
    };
}

export default function MccMncIndex({ mccMncList, filters, filterOptions }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [status, setStatus] = useState(filters.status || '');
    const [countryCode, setCountryCode] = useState(filters.country_code || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'id');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleSearch = () => {
        router.get('/mcc-mnc', {
            search,
            type,
            status,
            country_code: countryCode,
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
        router.get('/mcc-mnc', {
            search,
            type,
            status,
            country_code: countryCode,
            sort_by: field,
            sort_order: newOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setType('all');
        setStatus('all');
        setCountryCode('all');
        setSortBy('id');
        setSortOrder('desc');
        router.get('/mcc-mnc', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'operational':
                return 'default';
            case 'not operational':
                return 'destructive';
            case 'unknown':
                return 'secondary';
            case 'reserved':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'national':
                return 'default';
            case 'international':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="MCC-MNC List" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">MCC-MNC List</h1>
                        <p className="text-muted-foreground">
                            Total records: {mccMncList.total}
                        </p>
                    </div>
                    <Link href="/mcc-mnc/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={type || undefined} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {filterOptions.types.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={status || undefined} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {filterOptions.statuses.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={countryCode || undefined} onValueChange={setCountryCode}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {Object.entries(filterOptions.countries).map(([code, name]) => (
                                        <SelectItem key={code} value={code}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                            <Button variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="p-4 text-left font-medium">
                                            <button
                                                onClick={() => handleSort('mcc')}
                                                className="flex items-center gap-1 hover:text-primary"
                                            >
                                                MCC
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="p-4 text-left font-medium">
                                            <button
                                                onClick={() => handleSort('mnc')}
                                                className="flex items-center gap-1 hover:text-primary"
                                            >
                                                MNC
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="p-4 text-left font-medium">
                                            <button
                                                onClick={() => handleSort('country_name')}
                                                className="flex items-center gap-1 hover:text-primary"
                                            >
                                                Country
                                                <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="p-4 text-left font-medium">Brand</th>
                                        <th className="p-4 text-left font-medium">Operator</th>
                                        <th className="p-4 text-left font-medium">Type</th>
                                        <th className="p-4 text-left font-medium">Status</th>
                                        <th className="p-4 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mccMncList.data.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-4 font-mono">{item.mcc}</td>
                                            <td className="p-4 font-mono">{item.mnc}</td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium">{item.country_name}</div>
                                                    <div className="text-sm text-muted-foreground">{item.country_code}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">{item.brand || '-'}</td>
                                            <td className="p-4">{item.operator || '-'}</td>
                                            <td className="p-4">
                                                {item.type && (
                                                    <Badge variant={getTypeBadgeVariant(item.type)}>
                                                        {item.type}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {item.status && (
                                                    <Badge variant={getStatusBadgeVariant(item.status)}>
                                                        {item.status}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Link href={`/mcc-mnc/${item.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/mcc-mnc/${item.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {mccMncList.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((mccMncList.current_page - 1) * mccMncList.per_page) + 1} to{' '}
                                    {Math.min(mccMncList.current_page * mccMncList.per_page, mccMncList.total)} of{' '}
                                    {mccMncList.total} results
                                </div>
                                <div className="flex gap-2">
                                    {mccMncList.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-1 rounded border ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted'
                                            }`}
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