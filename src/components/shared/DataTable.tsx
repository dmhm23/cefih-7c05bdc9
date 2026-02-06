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
import { BulkActionsBar, BulkAction } from "./BulkActionsBar";
import { ColumnConfig } from "./ColumnSelector";

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
    <div className="space-y-2">
      {/* Bulk Actions Bar */}
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
              {data.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TableRow
                    key={item.id}
                    className={`group ${onRowClick ? "cursor-pointer" : ""} ${
                      isSelected ? "bg-muted/50" : ""
                    }`}
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
                    {visibleColumns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render
                          ? column.render(item)
                          : (item as Record<string, unknown>)[column.key] as React.ReactNode}
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
    </div>
  );
}
