import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  selectedIds,
  onClearSelection,
  actions,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-background border shadow-lg rounded-full px-5 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-full"
          onClick={onClearSelection}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="h-4 w-px bg-border" />
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
