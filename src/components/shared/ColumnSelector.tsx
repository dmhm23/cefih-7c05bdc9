import { Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ColumnConfig {
  key: string;
  header: string;
  visible: boolean;
  alwaysVisible?: boolean; // For columns that cannot be hidden (e.g., actions, checkbox)
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}

export function ColumnSelector({ columns, onChange }: ColumnSelectorProps) {
  const toggleColumn = (key: string) => {
    onChange(
      columns.map((col) =>
        col.key === key && !col.alwaysVisible
          ? { ...col, visible: !col.visible }
          : col
      )
    );
  };

  const visibleCount = columns.filter((c) => c.visible).length;
  const configurableColumns = columns.filter((c) => !c.alwaysVisible);

  const visibleConfigurable = configurableColumns.filter((c) => c.visible).length;
  const totalConfigurable = configurableColumns.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Columns className="h-4 w-4" />
          Columnas
          <span className="text-xs text-muted-foreground">
            ({visibleConfigurable}/{totalConfigurable})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Columnas visibles
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {configurableColumns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors"
            >
              <Checkbox
                checked={col.visible}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <span className="text-sm leading-none">{col.header}</span>
            </label>
          ))}
        </div>
        <div className="px-3 py-2 border-t flex justify-between items-center">
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() =>
              onChange(
                columns.map((c) =>
                  c.alwaysVisible ? c : { ...c, visible: true }
                )
              )
            }
          >
            Mostrar todas
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() =>
              onChange(
                columns.map((c) =>
                  c.alwaysVisible ? c : { ...c, visible: false }
                )
              )
            }
          >
            Ocultar todas
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
