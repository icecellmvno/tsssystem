import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { Plus, RefreshCw, Globe } from 'lucide-react';
import { mccMncService, type MccMnc } from '@/services/mcc-mnc';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable } from '@/components/ui/data-table';
import { 
  createIdColumn,
  createMccColumn,
  createMncColumn,
  createCountryColumn,
  createNetworkColumn,
  createIsoColumn,
  createCreatedAtColumn,
  createActionsColumn,
  type BaseRecord,
} from '@/components/ui/data-table-columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'MCC-MNC',
        href: '/mcc-mnc',
    },
];

// Extend MccMnc to include BaseRecord
interface MccMncWithBase extends MccMnc, BaseRecord {}

export default function MccMncIndex() {
    const { user } = useAuthStore();
    const [mccMncList, setMccMncList] = useState<MccMncWithBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Server-side pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState(''); // Separate state for input

    // Fetch MCC-MNC data with server-side pagination
    const fetchData = useCallback(async (page: number = currentPage, perPage: number = pageSize, search: string = searchTerm) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching MCC-MNC data...', { page, perPage, search });
            
            const dataResponse = await mccMncService.getAll({
                page,
                per_page: perPage,
                search: search || undefined,
            });
            
            console.log('MCC-MNC data response:', dataResponse);
            
            if (!dataResponse) {
                throw new Error('No response received from API');
            }
            
            if (!dataResponse.data) {
                throw new Error('Invalid response structure: missing data field');
            }
            
            if (!dataResponse.pagination) {
                throw new Error('Invalid response structure: missing pagination field');
            }
            
            console.log('Setting MCC-MNC list with', dataResponse.data.length, 'records');
            console.log('Pagination info:', dataResponse.pagination);
            
            setMccMncList(dataResponse.data);
            setTotalRecords(dataResponse.pagination.total);
            setTotalPages(dataResponse.pagination.total_pages);
            setCurrentPage(dataResponse.pagination.page);
            setPageSize(dataResponse.pagination.per_page);
        } catch (error) {
            console.error('Error fetching MCC-MNC data:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch MCC-MNC data');
            toast.error('Failed to fetch MCC-MNC data');
            
            // Set empty data to prevent further errors
            setMccMncList([]);
            setTotalRecords(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Debug effect to log data changes
    useEffect(() => {
        console.log('MCC-MNC list updated:', mccMncList.length, 'records');
        console.log('Pagination state:', { currentPage, pageSize, totalRecords, totalPages });
    }, [mccMncList, currentPage, pageSize, totalRecords, totalPages]);

    const handleDelete = async (record: MccMncWithBase) => {
        try {
            await mccMncService.delete(record.id);
            toast.success('MCC-MNC record deleted successfully');
            fetchData(); // Refresh the current page
        } catch (error) {
            console.error('Error deleting MCC-MNC record:', error);
            toast.error('Failed to delete MCC-MNC record');
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchData(newPage, pageSize, searchTerm);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when changing page size
        fetchData(1, newPageSize, searchTerm);
    };

    const handleSearch = useCallback((search: string) => {
        setSearchTerm(search);
        setCurrentPage(1); // Reset to first page when searching
        fetchData(1, pageSize, search);
    }, [fetchData, pageSize]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent form submission
        handleSearch(searchInput);
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            handleSearch(searchInput);
        }
    };

    // TanStack Table columns definition using common column components
    const columns = useMemo(() => [
        createIdColumn<MccMncWithBase>(),
        createMccColumn<MccMncWithBase>(),
        createMncColumn<MccMncWithBase>(),
        createCountryColumn<MccMncWithBase>(),
        createNetworkColumn<MccMncWithBase>(),
        createIsoColumn<MccMncWithBase>(),
        {
            accessorKey: 'country_code',
            header: 'Country Code',
            cell: ({ row }) => <span>{row.getValue('country_code')}</span>,
        },
        createCreatedAtColumn<MccMncWithBase>(),
        createActionsColumn<MccMncWithBase>({
            editPath: (record) => `/mcc-mnc/${record.id}/edit`,
            onDelete: handleDelete,
            deleteConfirmMessage: "Are you sure you want to delete this MCC-MNC record? This action cannot be undone.",
        }),
    ], []);

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-muted-foreground">Please log in to view MCC-MNC data.</p>
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
                        <p className="text-muted-foreground">Loading MCC-MNC data...</p>
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
                        <p className="text-destructive">Error loading MCC-MNC data: {error}</p>
                        <Button onClick={() => fetchData()} className="mt-4">
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
                <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-sm font-semibold">No MCC-MNC records found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating a new MCC-MNC record.
                </p>
                <Link to="/mcc-mnc/create">
                    <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add MCC-MNC
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
                        <h1 className="text-2xl font-bold tracking-tight">MCC-MNC Management</h1>
                        <p className="text-muted-foreground">
                            Manage Mobile Country Code and Mobile Network Code data ({totalRecords} total records)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchData()}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Link to="/mcc-mnc/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add MCC-MNC
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Custom Search Bar */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <input
                                    type="text"
                                    placeholder="Search MCC-MNC records..."
                                    value={searchInput}
                                    onChange={handleSearchInputChange}
                                    onKeyPress={handleSearchKeyPress}
                                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button type="submit" disabled={loading}>
                                Search
                            </Button>
                            {searchTerm && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        setSearchInput('');
                                        setSearchTerm('');
                                        fetchData(1, pageSize, '');
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Data Table with Server-Side Pagination */}
                <DataTable
                    columns={columns}
                    data={mccMncList}
                    title={`MCC-MNC Records (Page ${currentPage} of ${totalPages})`}
                    description={`Showing ${mccMncList.length} of ${totalRecords} total records`}
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
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
} 
