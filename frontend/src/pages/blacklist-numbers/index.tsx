import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { type BreadcrumbItem } from '@/types';
import { Search, Filter, ArrowUpDown, Plus, Phone, MessageSquare, User, Calendar, Trash2, Upload, Download, ChevronDown, Eye, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { blacklistNumbersService, type BlacklistNumber, type PaginatedBlacklistNumbers } from '@/services/blacklist-numbers';

interface BlacklistNumberWithBase extends BlacklistNumber, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Blacklist Numbers',
        href: '/blacklist-numbers',
    },
];

export default function BlacklistNumbersIndex() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { token } = useAuthStore();
    
    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(searchParams.get('sort_order') as 'asc' | 'desc' || 'desc');
    
    // Filter states
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    
    // Data states
    const [blacklistNumbers, setBlacklistNumbers] = useState<BlacklistNumberWithBase[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Dialog states
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [pasting, setPasting] = useState(false);
    const [pasteResult, setPasteResult] = useState<any>(null);


    // Fetch blacklist numbers with server-side pagination
    const fetchBlacklistNumbers = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, any> = {
                page: currentPage,
                per_page: pageSize,
                sort_by: sortBy,
                sort_order: sortOrder,
            };
            
            if (searchTerm) params.search = searchTerm;
            if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
            
            const data = await blacklistNumbersService.getBlacklistNumbers(params);
            
            // Transform data to include BaseRecord properties
            const transformedData: BlacklistNumberWithBase[] = data.data.map(item => ({
                ...item,
                id: item.id,
                created_at: item.created_at,
                updated_at: item.updated_at,
            }));
            
            setBlacklistNumbers(transformedData);
            setTotalRecords(data.total);
            setTotalPages(data.last_page);
            
            // Update URL params
            const newSearchParams = new URLSearchParams();
            if (searchTerm) newSearchParams.set('search', searchTerm);
            if (typeFilter !== 'all') newSearchParams.set('type', typeFilter);
            if (sortBy) newSearchParams.set('sort_by', sortBy);
            if (sortOrder) newSearchParams.set('sort_order', sortOrder);
            setSearchParams(newSearchParams);
            
        } catch (error) {
            console.error('Error fetching blacklist numbers:', error);
            toast.error('Failed to fetch blacklist numbers');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchTerm, typeFilter, sortBy, sortOrder, setSearchParams]);

    // Initial fetch
    useEffect(() => {
        fetchBlacklistNumbers();
    }, [fetchBlacklistNumbers]);

    // Handle search
    const handleSearch = useCallback(() => {
        setCurrentPage(1);
        fetchBlacklistNumbers();
    }, [fetchBlacklistNumbers]);

    // Handle clear filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setTypeFilter('all');
        setSortBy('created_at');
        setSortOrder('desc');
        setCurrentPage(1);
    }, []);

    // Handle delete
    const handleDelete = useCallback(async (blacklistNumber: BlacklistNumberWithBase) => {
        try {
            await blacklistNumbersService.deleteBlacklistNumber(blacklistNumber.id);
            toast.success('Blacklist number deleted successfully');
            fetchBlacklistNumbers();
        } catch (error) {
            console.error('Error deleting blacklist number:', error);
            toast.error('Failed to delete blacklist number');
        }
    }, [fetchBlacklistNumbers]);

    // Handle file import
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
        }
    }, []);

    const handleImport = useCallback(async () => {
        if (!importFile) return;
        
        setImporting(true);
        try {
            const result = await blacklistNumbersService.importBlacklistNumbers(importFile);
            setImportResult(result);
            toast.success('Import completed successfully');
            setImportDialogOpen(false);
            setImportFile(null);
            fetchBlacklistNumbers();
        } catch (error) {
            console.error('Error importing file:', error);
            toast.error('Failed to import file');
        } finally {
            setImporting(false);
        }
    }, [importFile, fetchBlacklistNumbers]);

    // Handle paste import
    const handlePasteImport = useCallback(async () => {
        if (!pasteText.trim()) return;
        
        setPasting(true);
        try {
            const result = await blacklistNumbersService.pasteImportBlacklistNumbers(pasteText);
            setPasteResult(result);
            toast.success('Paste import completed successfully');
            setPasteDialogOpen(false);
            setPasteText('');
            fetchBlacklistNumbers();
        } catch (error) {
            console.error('Error importing pasted text:', error);
            toast.error('Failed to import pasted text');
        } finally {
            setPasting(false);
        }
    }, [pasteText, fetchBlacklistNumbers]);

    // Format date helper
    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    }, []);

    // TanStack Table columns
    const columns = useMemo(() => [
        {
            accessorKey: 'number',
            header: 'Number',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{row.getValue('number')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                return (
                    <Badge variant={type === 'sms' ? 'destructive' : 'default'}>
                        {type === 'sms' ? (
                            <MessageSquare className="mr-1 h-3 w-3" />
                        ) : (
                            <User className="mr-1 h-3 w-3" />
                        )}
                        {type.toUpperCase()}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.getValue('reason') || 'No reason provided'}
                </span>
            ),
        },
        createCreatedAtColumn<BlacklistNumberWithBase>(),
        createActionsColumn<BlacklistNumberWithBase>({
            onDelete: handleDelete,
            editPath: (record) => `/blacklist-numbers/${record.id}/edit`,
            deleteConfirmMessage: "Are you sure you want to delete this blacklist number?",
        }),
    ], [handleDelete, formatDate]);

    // Custom pagination component
    const CustomPagination = () => (
        <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[5, 10, 20, 50, 100].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold tracking-tight">Blacklist Numbers</h1>
                        <p className="text-muted-foreground">Manage blacklisted phone numbers</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPasteDialogOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Paste Import
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setImportDialogOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import File
                        </Button>
                        <Link to="/blacklist-numbers/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Number
                            </Button>
                        </Link>
                    </div>
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
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="relative min-w-[200px]">
                                <Input
                                    placeholder="Search numbers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full"
                                />
                            </div>
                            
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="h-8 min-w-[120px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSearch}
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blacklist Numbers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={blacklistNumbers}
                            title="Blacklist Numbers"
                            description={`Showing ${blacklistNumbers.length} of ${totalRecords} blacklist numbers`}
                            showSearch={false}
                            showViewOptions={false}
                            showPagination={false}
                            pageSize={pageSize}
                        />
                        <CustomPagination />
                    </CardContent>
                </Card>

                {/* Import Dialog */}
                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import Blacklist Numbers</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file with blacklist numbers. The file should have columns: number, type, reason.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="import-file">Select File</Label>
                                <Input
                                    id="import-file"
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {importResult && (
                                <Alert>
                                    <AlertDescription>
                                        Import completed: {importResult.success_count} successful, {importResult.error_count} errors
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setImportDialogOpen(false)}
                                disabled={importing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!importFile || importing}
                            >
                                {importing ? 'Importing...' : 'Import'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Paste Import Dialog */}
                <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Paste Import Blacklist Numbers</DialogTitle>
                            <DialogDescription>
                                Paste phone numbers (one per line) to import them as blacklist numbers.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="paste-text">Phone Numbers</Label>
                                <Textarea
                                    id="paste-text"
                                    placeholder="Enter phone numbers, one per line..."
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                    rows={10}
                                />
                            </div>
                            {pasteResult && (
                                <Alert>
                                    <AlertDescription>
                                        Import completed: {pasteResult.success_count} successful, {pasteResult.error_count} errors
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setPasteDialogOpen(false)}
                                disabled={pasting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePasteImport}
                                disabled={!pasteText.trim() || pasting}
                            >
                                {pasting ? 'Importing...' : 'Import'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
} 