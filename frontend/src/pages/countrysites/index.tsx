import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Building2, 
    Phone, 
    User, 
    Users, 
    RefreshCw,
    Filter
} from 'lucide-react';
import { countrySitesService, type CountrySite } from '@/services/countrysites';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { useAuthStore } from '@/stores/auth-store';
import { type BreadcrumbItem } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { 
    createIdColumn, 
    createNameColumn, 
    createPhoneCodeColumn, 
    createManagerUserColumn, 
    createOperatorUserColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Country Sites',
        href: '/country-sites',
    },
];

interface CountrySiteWithBase extends CountrySite, BaseRecord {}

export default function CountrySitesIndex() {
    const { user } = useAuthStore();
    const [countrySites, setCountrySites] = useState<CountrySiteWithBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchCountrySites = useCallback(async (page: number = currentPage, perPage: number = pageSize, search: string = searchTerm, sortByField: string = sortBy, sortOrderField: string = sortOrder) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching country sites...', { page, perPage, search, sortByField, sortOrderField });
            const response = await countrySitesService.getAll({
                search: search || undefined,
                sort_by: sortByField,
                sort_order: sortOrderField,
                page,
                per_page: perPage,
            });
            console.log('Country sites response:', response);
            if (!response || !response.data) {
                throw new Error('Invalid response structure: missing data field');
            }
            console.log('Setting country sites with', response.data.length, 'records');
            setCountrySites(response.data);
            setTotalRecords(response.total || 0);
            setTotalPages(response.last_page || 1);
            setCurrentPage(page);
            setPageSize(perPage);
        } catch (error) {
            console.error('Error fetching country sites:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch country sites');
            toast.error('Failed to fetch country sites');
            setCountrySites([]);
            setTotalRecords(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm, sortBy, sortOrder]);

    useEffect(() => {
        fetchCountrySites();
    }, [fetchCountrySites]);

    const handleDelete = async (record: CountrySiteWithBase) => {
        try {
            await countrySitesService.delete(record.id);
            toast.success('Country site deleted successfully');
            fetchCountrySites(); // Reload the list
        } catch (error) {
            console.error('Error deleting country site:', error);
            toast.error('Failed to delete country site');
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    const handleSearch = (search: string) => {
        setSearchTerm(search);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    // Define columns for TanStack Table
    const columns = [
        createIdColumn<CountrySiteWithBase>(),
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {row.getValue('name')}
                </div>
            )
        },
        {
            accessorKey: 'country_phone_code',
            header: 'Phone Code',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{row.getValue('country_phone_code')}</Badge>
                </div>
            )
        },
        {
            accessorKey: 'manager_user_name',
            header: 'Manager User',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {row.getValue('manager_user_name') || 'N/A'}
                </div>
            )
        },
        {
            accessorKey: 'operator_user_name',
            header: 'Operator User',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {row.getValue('operator_user_name') || 'N/A'}
                </div>
            )
        },
        createCreatedAtColumn<CountrySiteWithBase>(),
        createActionsColumn<CountrySiteWithBase>({
            onDelete: handleDelete,
            editPath: (record) => `/country-sites/${record.id}/edit`,
            deleteConfirmMessage: "Are you sure you want to delete this country site? This action cannot be undone."
        })
    ];

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-muted-foreground">Please log in to view country sites.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading country sites...</p>
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
                        <p className="text-destructive">Error loading country sites: {error}</p>
                        <Button onClick={() => fetchCountrySites()} className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const emptyState = (
        <div className="flex items-center justify-center py-8">
            <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-sm font-semibold">No country sites found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating a new country site.
                </p>
                <Link to="/country-sites/create">
                    <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Country Site
                    </Button>
                </Link>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Country Sites</h1>
                        <p className="text-muted-foreground">
                            Manage country sites and their configurations ({totalRecords} total records)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchCountrySites()}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Link to="/country-sites/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Country Site
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search country sites..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    className="border rounded px-2 py-1 text-sm"
                                >
                                    {[5, 10, 15, 20, 25, 30, 40, 50, 100].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table with Server-Side Pagination */}
                <DataTable
                    columns={columns}
                    data={countrySites}
                    title={`Country Sites (Page ${currentPage} of ${totalPages})`}
                    description={`Showing ${countrySites.length} of ${totalRecords} total records`}
                    emptyState={emptyState}
                    pageSize={pageSize}
                    showSearch={false} // Disable built-in search since we have custom search
                    showViewOptions={false} // Disable column visibility for server-side pagination
                    showPagination={false} // Disable client-side pagination
                    className="space-y-4"
                />

                {/* Custom Server-Side Pagination */}
                {totalPages > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                    >
                                        First
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Last
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
} 