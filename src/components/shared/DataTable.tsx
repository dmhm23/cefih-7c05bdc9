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
import { Eye } from "lucide-react";
import { BulkActionsBar, BulkAction } from "./BulkActionsBar";
import { ColumnConfig } from "./ColumnSelector";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

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
}: DataTableProps<T>) {
  // Filter visible columns based on config
  const visibleColumns = columnConfig
    ? columns.filter((col) => {
        const config = columnConfig.find((c) => c.key === col.key);
        return config ? config.visible : true;
      })
    : columns;

  const handleSelectAll = () => {
    if (onSelectionChange) {
      onSelectionChange(data.map((item) => item.id));
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

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < data.length;

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
    <div className="space-y-2 min-w-0 w-full" data-table-container>
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
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
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => {
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
