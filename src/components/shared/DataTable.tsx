import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { BulkActionsBar, BulkAction } from "./BulkActionsBar";
import { ColumnConfig } from "./ColumnSelector";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
  sortValue?: (item: T) => string | number;
}

type SortDirection = "asc" | "desc";

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  countLabel?: string;
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
  // Column visibility
  columnConfig?: ColumnConfig[];
  // Panel state for "Ver" button
  isPanelOpen?: boolean;
  activeRowId?: string;
  onViewRow?: (item: T) => void;
  // Sort
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  // Layout
  containerClassName?: string;
}

function getSortValue<T>(item: T, column: Column<T> | undefined, sortKey: string): string | number {
  if (column?.sortValue) return column.sortValue(item);
  const key = column?.sortKey || sortKey;
  const val = (item as Record<string, unknown>)[key];
  if (val == null) return "";
  if (typeof val === "number") return val;
  return String(val);
}

function compareValues(a: string | number, b: string | number, direction: SortDirection): number {
  const mult = direction === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * mult;
  const sa = String(a);
  const sb = String(b);
  return sa.localeCompare(sb, "es", { numeric: true }) * mult;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
  countLabel = "registros",
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions = [],
  columnConfig,
  isPanelOpen = false,
  activeRowId,
  onViewRow,
  defaultSortKey = "createdAt",
  defaultSortDirection = "desc",
  containerClassName,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  // Filter visible columns based on config
  const visibleColumns = columnConfig
    ? columns.filter((col) => {
        const config = columnConfig.find((c) => c.key === col.key);
        return config ? config.visible : false;
      })
    : columns;

  // Find column for current sort
  const sortColumn = columns.find(
    (c) => c.key === sortKey || c.sortKey === sortKey
  );

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) =>
      compareValues(
        getSortValue(a, sortColumn, sortKey),
        getSortValue(b, sortColumn, sortKey),
        sortDirection
      )
    );
    return sorted;
  }, [data, sortKey, sortDirection, sortColumn]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    const key = column.sortKey || column.key;
    if (sortKey === key) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    const key = column.sortKey || column.key;
    const isActive = sortKey === key;
    if (!isActive) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-foreground" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-foreground" />;
  };

  const handleSelectAll = () => {
    if (onSelectionChange) {
      onSelectionChange(sortedData.map((item) => item.id));
    }
  };

  const handleClearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectionChange) {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((i) => i !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    }
  };

  const isAllSelected = sortedData.length > 0 && selectedIds.length === sortedData.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < sortedData.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col min-h-0 w-full", containerClassName)} data-table-container>
      <div className="flex-1 min-h-0 rounded-lg border overflow-hidden">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/80">
                {selectable && (
                  <TableHead className="w-[40px] px-3">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isPartiallySelected;
                        }
                      }}
                      onCheckedChange={() =>
                        isAllSelected ? handleClearSelection() : handleSelectAll()
                      }
                      aria-label="Seleccionar todos"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableHead>
                )}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.className,
                      column.sortable && "cursor-pointer select-none hover:bg-muted/60 transition-colors"
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <span className="inline-flex items-center">
                      {column.header}
                      {renderSortIcon(column)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isActiveRow = activeRowId === item.id;
                const showViewButton = isPanelOpen && !isActiveRow && onViewRow;
                
                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "group relative transition-colors",
                      onRowClick && "cursor-pointer",
                      isSelected 
                        ? "bg-primary/10 border-l-2 border-l-primary" 
                        : "hover:bg-muted/30"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <TableCell className="w-[40px] px-3">
                        <Checkbox
                          checked={isSelected}
                          onClick={(e) => handleToggleRow(item.id, e)}
                          aria-label={`Seleccionar fila`}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column, colIndex) => (
                      <TableCell key={column.key} className={cn(column.className, colIndex === 0 && "relative")}>
                        {column.render
                          ? column.render(item)
                          : (item as Record<string, unknown>)[column.key] as React.ReactNode}
                        
                        {/* "Ver" button - only on first visible column */}
                        {colIndex === 0 && showViewButton && (
                          <Button
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 
                                       opacity-0 group-hover:opacity-100 transition-opacity
                                       h-6 px-2 text-xs bg-primary hover:bg-primary/90
                                       shadow-sm z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewRow(item);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="text-sm text-muted-foreground py-1 px-1">
        {data.length} {countLabel}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectable && selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          totalCount={data.length}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          actions={bulkActions}
        />
      )}
    </div>
  );
}
