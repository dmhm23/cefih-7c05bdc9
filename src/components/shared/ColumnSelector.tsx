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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Columns className="h-4 w-4" />
          Columnas
          <span className="text-xs text-muted-foreground">
            ({visibleCount})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {configurableColumns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted"
            >
              <Checkbox
                checked={col.visible}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <span className="text-sm">{col.header}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
