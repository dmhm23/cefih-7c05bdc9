import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface BulkAction {
  label: string;
  icon?: React.ElementType;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  onClick: (ids: string[]) => void;
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  selectedIds: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  selectedIds,
  onSelectAll,
  onClearSelection,
  actions,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-2">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isAllSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isPartiallySelected;
            }
          }}
          onCheckedChange={() => (isAllSelected ? onClearSelection() : onSelectAll())}
          aria-label="Seleccionar todos"
        />
        <span className="text-sm font-medium">
          {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground"
          onClick={onClearSelection}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
      </div>
      <div className="flex gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant || "outline"}
            size="sm"
            className="h-8"
            onClick={() => action.onClick(selectedIds)}
          >
            {action.icon && <action.icon className="h-4 w-4 mr-1.5" />}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
