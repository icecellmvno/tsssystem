import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  title?: string
  description?: string
  showSearch?: boolean
  showViewOptions?: boolean
  showPagination?: boolean
  showRowSelection?: boolean
  pageSize?: number
  emptyState?: React.ReactNode
  onRowClick?: (row: TData) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  onRowSelectionChange?: (selectedRows: string[]) => void
  selectedRows?: string[]
  rowSelectionKey?: string
  loading?: boolean
  actions?: React.ReactNode
  filters?: React.ReactNode
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  title,
  description,
  showSearch = true,
  showViewOptions = true,
  showPagination = true,
  showRowSelection = false,
  pageSize = 15,
  emptyState,
  onRowClick,
  globalFilter,
  onGlobalFilterChange,
  onRowSelectionChange,
  selectedRows,
  rowSelectionKey,
  loading = false,
  actions,
  filters,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  })

  // Use external row selection if provided, otherwise use internal state
  const currentRowSelection = selectedRows && rowSelectionKey 
    ? selectedRows.reduce((acc, id) => {
        const rowIndex = data.findIndex(row => (row as any)[rowSelectionKey] === id)
        if (rowIndex !== -1) {
          acc[rowIndex] = true
        }
        return acc
      }, {} as Record<string, boolean>)
    : internalRowSelection

  const setCurrentRowSelection = onRowSelectionChange && rowSelectionKey
    ? (updater: any) => {
        const newSelection = typeof updater === 'function' ? updater(currentRowSelection) : updater
        const selectedIds = Object.keys(newSelection).map(index => {
          const rowIndex = parseInt(index)
          return (data[rowIndex] as any)[rowSelectionKey]
        }).filter(Boolean)
        onRowSelectionChange(selectedIds)
      }
    : setInternalRowSelection

  // Use external global filter if provided, otherwise use internal state
  const currentGlobalFilter = globalFilter !== undefined ? globalFilter : internalGlobalFilter
  const setCurrentGlobalFilter = onGlobalFilterChange || setInternalGlobalFilter

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setCurrentRowSelection,
    onGlobalFilterChange: setCurrentGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: currentRowSelection,
      globalFilter: currentGlobalFilter,
      pagination,
    },
    globalFilterFn: 'includesString',
    manualPagination: false,
  })

  const defaultEmptyState = (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
          <Filter className="h-12 w-12" />
        </div>
        <h3 className="text-sm font-semibold">No data found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No records match your current filters.
        </p>
      </div>
    </div>
  )

  return (
    <div className={className}>
      {/* Search and Filters */}
      {(showSearch || filters || actions) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {showSearch && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={currentGlobalFilter ?? ''}
                    onChange={(e) => setCurrentGlobalFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              {filters && (
                <div className="flex-1">
                  {filters}
                </div>
              )}
              {showViewOptions && (
                <DataTableViewOptions table={table} />
              )}
              {actions && (
                <div className="flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {title || "Data Table"} ({table.getFilteredRowModel().rows.length} total)
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                <h3 className="text-sm font-semibold">Loading...</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please wait while we fetch the data.
                </p>
              </div>
            </div>
          ) : table.getFilteredRowModel().rows.length === 0 ? (
            emptyState || defaultEmptyState
          ) : (
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
                        onClick={() => onRowClick?.(row.original)}
                        className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
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
          )}

          {/* Pagination */}
          {showPagination && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <DataTablePagination table={table} showRowSelection={showRowSelection} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Export individual components for custom implementations
export {
  DataTablePagination,
  DataTableViewOptions,
} 