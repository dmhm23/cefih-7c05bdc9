import { ReactNode } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";

interface TableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterCount?: number;
  onFilterClick?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
}

export function TableToolbar({
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  filterCount = 0,
  onFilterClick,
  children,
  actions,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-2">
        {onFilterClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterClick}
            className="h-9 gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtro
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filterCount}
              </Badge>
            )}
          </Button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-3">
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          className="w-72"
        />
        {actions}
      </div>
    </div>
  );
}
