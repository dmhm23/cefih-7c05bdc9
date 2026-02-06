import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multiselect";
  options: FilterOption[];
}

interface FilterPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterConfig[];
  values: Record<string, string | string[]>;
  onChange: (key: string, value: string | string[]) => void;
  onClear: () => void;
  trigger: React.ReactNode;
}

export function FilterPopover({
  open,
  onOpenChange,
  filters,
  values,
  onChange,
  onClear,
  trigger,
}: FilterPopoverProps) {
  const activeCount = Object.values(values).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v && v !== "todos"
  ).length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-medium text-sm">Filtros</span>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 space-y-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {filter.label}
                </Label>
                {filter.type === "select" ? (
                  <Select
                    value={(values[filter.key] as string) || "todos"}
                    onValueChange={(value) => onChange(filter.key, value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filter.options.map((option) => {
                      const currentValues = (values[filter.key] as string[]) || [];
                      const isChecked = currentValues.includes(option.value);
                      return (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${filter.key}-${option.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newValues = checked
                                ? [...currentValues, option.value]
                                : currentValues.filter((v) => v !== option.value);
                              onChange(filter.key, newValues);
                            }}
                          />
                          <label
                            htmlFor={`${filter.key}-${option.value}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
