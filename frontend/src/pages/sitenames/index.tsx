import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, Plus, Building2, User, Users, Trash2, Edit } from 'lucide-react';
import { sitenamesService, type Sitename } from '@/services/sitenames';
import { toast } from 'sonner';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';

export default function SitenamesIndex() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const [sitenames, setSitenames] = useState<Sitename[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data once on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await sitenamesService.getAll({
                    sort_by: sorting.length > 0 ? sorting[0].id : 'id',
                    sort_order: sorting.length > 0 ? sorting[0].desc ? 'desc' : 'asc' : 'desc',
                });
                setSitenames(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch sitenames');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [sorting]);

    const handleDelete = async (id: number) => {
        try {
            await sitenamesService.delete(id);
            toast.success('Sitename deleted successfully');
            // Refetch data after deletion
            const response = await sitenamesService.getAll({
                sort_by: sorting.length > 0 ? sorting[0].id : 'id',
                sort_order: sorting.length > 0 ? sorting[0].desc ? 'desc' : 'asc' : 'desc',
            });
            setSitenames(response.data);
        } catch (error) {
            toast.error('Failed to delete sitename');
        }
    };

    const columns: ColumnDef<Sitename>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{row.getValue("name")}</span>
                </div>
            ),
        },
        {
            accessorKey: "manager_user",
            header: "Site Manager",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <div className="font-medium">Manager User {row.getValue("manager_user")}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "operator_user",
            header: "NOC User",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <div className="font-medium">Operator User {row.getValue("operator_user")}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created" />
            ),
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {new Date(row.getValue("created_at")).toLocaleDateString()}
                </div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const sitename = row.original

                return (
                    <div className="flex items-center gap-1">
                        <Link to={`/sitenames/${sitename.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Delete"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Sitename</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete "{sitename.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(sitename.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: sitenames,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        globalFilterFn: 'includesString',
    })

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading sitenames: {error}</div>;
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Sitenames</h1>
                        <p className="text-muted-foreground">
                            Total records: {sitenames.length}
                        </p>
                    </div>
                    <Link to="/sitenames/create">
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
                            <Search className="h-4 w-4" />
                            Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search sitenames..."
                                    value={globalFilter ?? ""}
                                    onChange={(event) => setGlobalFilter(event.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <DataTableViewOptions table={table} />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <DataTablePagination table={table} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 