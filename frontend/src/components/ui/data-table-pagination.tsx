import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  showRowSelection?: boolean
}

export function DataTablePagination<TData>({
  table,
  showRowSelection = false,
}: DataTablePaginationProps<TData>) {
  // Get pagination state with fallbacks
  const pagination = table.getState().pagination || { pageIndex: 0, pageSize: 10 }
  const pageIndex = pagination.pageIndex || 0
  const pageSize = pagination.pageSize || 10
  const pageCount = Math.max(1, table.getPageCount() || 1)

  // Calculate total rows and current page info
  const totalRows = table.getFilteredRowModel().rows.length
  const startRow = totalRows > 0 ? pageIndex * pageSize + 1 : 0
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  // Check if pagination controls should be shown
  const shouldShowPagination = totalRows > 0 && pageCount > 1

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {showRowSelection ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of {totalRows} row(s) selected.
          </>
        ) : (
          <>
            {totalRows > 0 ? (
              <>Showing {startRow} to {endRow} of {totalRows} row(s).</>
            ) : (
              <>No rows to display.</>
            )}
          </>
        )}
      </div>
      {shouldShowPagination && (
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 15, 20, 25, 30, 40, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {pageIndex + 1} of {pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 