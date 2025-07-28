import { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  FilterFn,
} from '@tanstack/react-table'

interface UseDataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  pageSize?: number
  enableRowSelection?: boolean
  enableMultiRowSelection?: boolean
  enableSorting?: boolean
  enableGlobalFilter?: boolean
  enableColumnFilters?: boolean
  globalFilterFn?: FilterFn<TData>
}

export function useDataTable<TData>({
  data,
  columns,
  pageSize = 15,
  enableRowSelection = false,
  enableMultiRowSelection = false,
  enableSorting = true,
  enableGlobalFilter = true,
  enableColumnFilters = true,
  globalFilterFn,
}: UseDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableColumnFilters ? setColumnFilters : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    state: {
      sorting: enableSorting ? sorting : [],
      columnFilters: enableColumnFilters ? columnFilters : [],
      columnVisibility,
      rowSelection: enableRowSelection ? rowSelection : {},
      globalFilter: enableGlobalFilter ? globalFilter : '',
    },
    globalFilterFn,
    enableRowSelection,
    enableMultiRowSelection,
    enableSorting,
    enableGlobalFilter,
    enableColumnFilters,


    initialState: {
      pagination: { 
        pageSize: pageSize || 15,
        pageIndex: 0,
      },
    },
  })

  return {
    table,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    globalFilter,
    setGlobalFilter,
  }
} 