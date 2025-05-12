import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterBySearchTerm } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  // Allows custom rendering of cell content
  cell?: (item: T) => React.ReactNode;
  // For custom classes on individual cells (optional)
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pagination?: boolean;
  pageSize?: number;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys,
  pagination = true,
  pageSize = 10,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Filter data based on search term
  const filteredData = searchKeys && searchTerm
    ? filterBySearchTerm(data, searchTerm, searchKeys)
    : data;

  // Paginate data
  const paginatedData = pagination
    ? filteredData.slice((page - 1) * currentPageSize, page * currentPageSize)
    : filteredData;

  const totalPages = pagination
    ? Math.ceil(filteredData.length / currentPageSize)
    : 1;

  // Reset page when data changes
  if (pagination && page > totalPages && totalPages > 0) {
    setPage(1);
  }

  return (
    <div className="w-full">
      {searchKeys && (
        <div className="flex mb-4 gap-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (pagination) setPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {column.cell
                        ? column.cell(item)
                        : (item[column.accessorKey] as React.ReactNode)}
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
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex-1 text-sm text-gray-500">
            Showing {filteredData.length > 0 ? (page - 1) * currentPageSize + 1 : 0} to{" "}
            {Math.min(page * currentPageSize, filteredData.length)} of{" "}
            {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Select
                value={String(currentPageSize)}
                onValueChange={(value) => {
                  setCurrentPageSize(Number(value));
                  setPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={currentPageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">per page</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
