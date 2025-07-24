import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { Search, Filter, ArrowUpDown, Plus, Phone, MessageSquare, User, Calendar, Trash2, Upload, Download, ChevronDown, Eye, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

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

interface BlacklistNumberItem {
    id: number;
    number: string;
    type: 'sms' | 'manual';
    reason: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: BlacklistNumberItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

export default function BlacklistNumbersIndex() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { token } = useAuthStore();
    
    const [blacklistNumbers, setBlacklistNumbers] = useState<PaginatedData>({
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
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [pasting, setPasting] = useState(false);
    const [pasteResult, setPasteResult] = useState<any>(null);

    // Fetch blacklist numbers
    useEffect(() => {
        const fetchBlacklistNumbers = async () => {
            setIsLoading(true);
            try {
                const params: Record<string, any> = {};
                if (search) params.search = search;
                if (type && type !== 'all') params.type = type;
                if (sortBy) params.sort_by = sortBy;
                if (sortOrder) params.sort_order = sortOrder;
                
                const data = await apiClient.get<PaginatedData>('/blacklist-numbers', params);
                setBlacklistNumbers(data);
            } catch (error) {
                console.error('Error fetching blacklist numbers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlacklistNumbers();
    }, [search, type, sortBy, sortOrder]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (type && type !== 'all') params.append('type', type);
        if (sortBy) params.append('sort_by', sortBy);
        if (sortOrder) params.append('sort_order', sortOrder);
        
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

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const deleteBlacklistNumber = (id: number) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await apiClient.delete(`/blacklist-numbers/${deleteId}`);
                // Refresh the data
                window.location.reload();
            } catch (error) {
                console.error('Error deleting blacklist number:', error);
            }
            
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const result = await apiClient.post<{ success: boolean; message: string }>('/blacklist-numbers/bulk-import', { file: importFile });
            setImportResult(result);

            if (result.success) {
                // Refresh the page to show new data
                window.location.reload();
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: 'Import failed. Please try again.',
            });
        } finally {
            setImporting(false);
        }
    };

    const handleSelectAll = (checked: boolean | string) => {
        setSelectAll(checked === true);
        if (checked === true) {
            setSelectedIds(blacklistNumbers.data.map((item) => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number, checked: boolean | string) => {
        if (checked === true) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((i) => i !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm('Are you sure you want to delete selected numbers?')) return;
        try {
            await apiClient.post('/blacklist-numbers/bulk-delete', { ids: selectedIds });
            window.location.reload();
        } catch (error) {
            console.error('Error bulk deleting blacklist numbers:', error);
        }
    };

    const handlePasteImport = async () => {
        setPasting(true);
        setPasteResult(null);
        try {
            const result = await apiClient.post<{ success: boolean; message: string }>('/blacklist-numbers/bulk-paste', { lines: pasteText });
            setPasteResult(result);
            if (result.success) {
                setPasteText('');
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (e) {
            setPasteResult({ success: false, message: 'Import failed.' });
        } finally {
            setPasting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Blacklist Numbers</h1>
                        <p className="text-muted-foreground">
                            Total records: {blacklistNumbers.total}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Options
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link to="/blacklist-numbers/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Single Number
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPasteDialogOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Paste to Add
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Bulk Import
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/blacklist-numbers/template">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Template
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {selectedIds.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                Bulk Delete ({selectedIds.length})
                            </Button>
                        )}
                    </div>

                    {/* Bulk Import Dialog */}
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Bulk Import Blacklist Numbers</DialogTitle>
                                <DialogDescription>
                                    Upload an Excel or CSV file to import multiple blacklist numbers at once.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="import-file">Select File</Label>
                                    <Input
                                        id="import-file"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
                                    </p>
                                </div>

                                {importResult && (
                                    <Alert variant={importResult.success ? 'default' : 'destructive'}>
                                        <AlertDescription>{importResult.message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setImportDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleImport}
                                        disabled={!importFile || importing}
                                    >
                                        {importing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Import
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Confirm Delete</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to remove this number from blacklist? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="search"
                                        placeholder="Search by number or reason..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} size="sm">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="manual">Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Sort By</Label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at">Created Date</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="type">Type</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Sort Order</Label>
                                <Select value={sortOrder} onValueChange={setSortOrder}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Descending</SelectItem>
                                        <SelectItem value="asc">Ascending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button variant="outline" onClick={clearFilters}>
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
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('number')}
                                                className="flex items-center gap-1 p-0 h-auto font-semibold"
                                            >
                                                Number
                                                <ArrowUpDown className="h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('type')}
                                                className="flex items-center gap-1 p-0 h-auto font-semibold"
                                            >
                                                Type
                                                <ArrowUpDown className="h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort('created_at')}
                                                className="flex items-center gap-1 p-0 h-auto font-semibold"
                                            >
                                                Created Date
                                                <ArrowUpDown className="h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {blacklistNumbers.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Phone className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No blacklist numbers found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        blacklistNumbers.data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={(checked) => handleSelectRow(item.id, checked)} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-mono">{item.number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={item.type === 'sms' ? 'destructive' : 'default'}>
                                                        {item.type === 'sms' ? (
                                                            <MessageSquare className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <User className="mr-1 h-3 w-3" />
                                                        )}
                                                        {item.type.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.reason || 'No reason provided'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(item.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link to={`/blacklist-numbers/${item.id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link to={`/blacklist-numbers/${item.id}/edit`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteBlacklistNumber(item.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {blacklistNumbers.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((blacklistNumbers.current_page - 1) * blacklistNumbers.per_page) + 1} to{' '}
                                    {Math.min(blacklistNumbers.current_page * blacklistNumbers.per_page, blacklistNumbers.total)} of{' '}
                                    {blacklistNumbers.total} results
                                </p>
                                <div className="flex gap-2">
                                    {blacklistNumbers.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    setSearchParams(url.searchParams);
                                                }
                                            }}
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Paste Dialog */}
            <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                                     <DialogHeader>
                     <DialogTitle>Paste to Bulk Add</DialogTitle>
                     <DialogDescription>Enter one number per line or number,type,reason format.</DialogDescription>
                 </DialogHeader>
                    <Textarea rows={8} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder={'+905551234567\nmanuel\n+905559876543,sms,spam'} />
                    {pasteResult && (
                        <Alert variant={pasteResult.success ? 'default' : 'destructive'}>
                            <AlertDescription>{pasteResult.message}</AlertDescription>
                        </Alert>
                    )}
                                         <div className="flex justify-end gap-2">
                         <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>Cancel</Button>
                         <Button onClick={handlePasteImport} disabled={pasting}>{pasting ? 'Adding...' : 'Add'}</Button>
                     </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 