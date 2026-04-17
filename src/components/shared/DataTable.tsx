import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const DATATABLE_PAGE_SIZE = 100;
/** Tamaño del primer "paint" — más pequeño para que la tabla aparezca casi instantánea. */
const FIRST_PAINT_SIZE = 30;

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
  // Lazy load
  pageSize?: number;
  itemLabel?: string;
}

function getSortValue<T>(item: T, column: Column<T> | undefined, sortKey: string): string | number {
  if (column?.sortValue) return column.sortValue(item);
  const key = column?.sortKey || sortKey;
  const val = (item as Record<string, unknown>)[key];
  if (val == null) return "";
  if (typeof val === "number") return val;
  return String(val);
}

// Colator único para localeCompare — instanciar el Intl.Collator es costoso si se hace por comparación.
const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

function compareValues(a: string | number, b: string | number, direction: SortDirection): number {
  const mult = direction === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * mult;
  return collator.compare(String(a), String(b)) * mult;
}

// ---------------------------------------------------------------------------
// Fila memoizada: evita re-render de TODAS las filas cuando cambia un único id
// seleccionado, el activeRowId o cualquier estado del padre que no afecte la fila.
// ---------------------------------------------------------------------------
interface DataRowProps<T> {
  item: T;
  visibleColumns: Column<T>[];
  selectable: boolean;
  isSelected: boolean;
  isActiveRow: boolean;
  showViewButton: boolean;
  onRowClick?: (item: T) => void;
  onToggleRow?: (id: string, e: React.MouseEvent) => void;
  onViewRow?: (item: T) => void;
}

function DataRowInner<T extends { id: string }>({
  item,
  visibleColumns,
  selectable,
  isSelected,
  isActiveRow,
  showViewButton,
  onRowClick,
  onToggleRow,
  onViewRow,
}: DataRowProps<T>) {
  return (
    <TableRow
      className={cn(
        "group relative transition-colors",
        onRowClick && "cursor-pointer",
        isSelected
          ? "bg-primary/10 border-l-2 border-l-primary"
          : "hover:bg-muted/30"
      )}
      onClick={onRowClick ? () => onRowClick(item) : undefined}
    >
      {selectable && (
        <TableCell className="w-[40px] px-3">
          <Checkbox
            checked={isSelected}
            onClick={(e) => onToggleRow?.(item.id, e)}
            aria-label="Seleccionar fila"
          />
        </TableCell>
      )}
      {visibleColumns.map((column, colIndex) => (
        <TableCell key={column.key} className={cn(column.className, colIndex === 0 && "relative")}>
          {column.render
            ? column.render(item)
            : (item as Record<string, unknown>)[column.key] as React.ReactNode}

          {colIndex === 0 && showViewButton && onViewRow && (
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
}

// memo con comparación superficial — solo re-renderiza si cambian props relevantes a la fila.
const DataRow = memo(DataRowInner, (prev, next) => {
  return (
    prev.item === next.item &&
    prev.visibleColumns === next.visibleColumns &&
    prev.selectable === next.selectable &&
    prev.isSelected === next.isSelected &&
    prev.isActiveRow === next.isActiveRow &&
    prev.showViewButton === next.showViewButton &&
    prev.onRowClick === next.onRowClick &&
    prev.onToggleRow === next.onToggleRow &&
    prev.onViewRow === next.onViewRow
  );
}) as <T extends { id: string }>(props: DataRowProps<T>) => JSX.Element;

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
  pageSize = DATATABLE_PAGE_SIZE,
  itemLabel,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [visibleCount, setVisibleCount] = useState(FIRST_PAINT_SIZE);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Memoizar columnas visibles — evita Array.find/filter en cada render.
  const visibleColumns = useMemo(() => {
    if (!columnConfig) return columns;
    const visibleSet = new Set(
      columnConfig.filter((c) => c.visible).map((c) => c.key)
    );
    return columns.filter((col) => visibleSet.has(col.key));
  }, [columns, columnConfig]);

  // Memoizar columna de sort.
  const sortColumn = useMemo(
    () => columns.find((c) => c.key === sortKey || c.sortKey === sortKey),
    [columns, sortKey]
  );

  // Set de seleccionados — lookup O(1) en vez de O(n) por cada fila.
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Sort data (memoizado por data + sort key/dir).
  const sortedData = useMemo(() => {
    if (data.length === 0) return data;
    // Evitar el copy si no hay sort efectivo.
    const sorted = data.slice();
    sorted.sort((a, b) =>
      compareValues(
        getSortValue(a, sortColumn, sortKey),
        getSortValue(b, sortColumn, sortKey),
        sortDirection
      )
    );
    return sorted;
  }, [data, sortKey, sortDirection, sortColumn]);

  // Reset visible count cuando cambian datos o sort. Empieza con FIRST_PAINT_SIZE
  // para que la tabla aparezca casi instantánea, luego sube a pageSize.
  useEffect(() => {
    setVisibleCount(FIRST_PAINT_SIZE);
  }, [data, sortKey, sortDirection]);

  // Tras el primer paint, si hay más datos, subir a pageSize en el siguiente frame
  // para que el observer ya tenga material precargado sin bloquear la UI.
  useEffect(() => {
    if (visibleCount === FIRST_PAINT_SIZE && sortedData.length > FIRST_PAINT_SIZE) {
      const id = requestAnimationFrame(() => {
        setVisibleCount((prev) =>
          prev === FIRST_PAINT_SIZE ? Math.min(pageSize, sortedData.length) : prev
        );
      });
      return () => cancelAnimationFrame(id);
    }
  }, [visibleCount, sortedData.length, pageSize]);

  // Visible slice for lazy rendering (memoizado).
  const visibleData = useMemo(
    () => sortedData.slice(0, visibleCount),
    [sortedData, visibleCount]
  );
  const hasMore = visibleCount < sortedData.length;

  // IntersectionObserver estable: dependencias mínimas para no recrear en cada incremento.
  // Usamos un ref para leer siempre el valor actualizado de sortedData.length.
  const sortedLenRef = useRef(sortedData.length);
  sortedLenRef.current = sortedData.length;

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, sortedLenRef.current));
        }
      },
      { root, rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, pageSize]);

  const handleSort = useCallback((column: Column<T>) => {
    if (!column.sortable) return;
    const key = column.sortKey || column.key;
    setSortKey((prev) => {
      if (prev === key) {
        setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortDirection("desc");
      return key;
    });
  }, []);

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    const key = column.sortKey || column.key;
    const isActive = sortKey === key;
    if (!isActive) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-foreground" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-foreground" />;
  };

  const handleSelectAll = useCallback(() => {
    onSelectionChange?.(sortedData.map((item) => item.id));
  }, [onSelectionChange, sortedData]);

  const handleClearSelection = useCallback(() => {
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // Toggle estable basado en Set para evitar recrearlo cada render del padre.
  const handleToggleRow = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onSelectionChange) return;
      if (selectedSet.has(id)) {
        onSelectionChange(selectedIds.filter((i) => i !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    },
    [onSelectionChange, selectedSet, selectedIds]
  );

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
        <div className="overflow-auto h-full" ref={scrollContainerRef}>
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
              {visibleData.map((item) => {
                const isSelected = selectedSet.has(item.id);
                const isActiveRow = activeRowId === item.id;
                const showViewButton = isPanelOpen && !isActiveRow && !!onViewRow;

                return (
                  <DataRow<T>
                    key={item.id}
                    item={item}
                    visibleColumns={visibleColumns}
                    selectable={selectable}
                    isSelected={isSelected}
                    isActiveRow={isActiveRow}
                    showViewButton={showViewButton}
                    onRowClick={onRowClick}
                    onToggleRow={selectable ? handleToggleRow : undefined}
                    onViewRow={onViewRow}
                  />
                );
              })}
              {hasMore && (
                <TableRow ref={sentinelRef} className="hover:bg-transparent">
                  <TableCell
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    className="text-center py-4 text-sm text-muted-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando más registros...
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="text-sm text-muted-foreground py-1 px-1">
        {hasMore
          ? `Mostrando ${visibleData.length.toLocaleString("es-CO")} de ${data.length.toLocaleString("es-CO")} ${itemLabel ?? countLabel}`
          : `${data.length.toLocaleString("es-CO")} ${itemLabel ?? countLabel}`}
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
