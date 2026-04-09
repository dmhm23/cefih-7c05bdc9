import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface RowActionsProps {
  actions: RowAction[];
  showOnHover?: boolean;
}

export function RowActions({ actions, showOnHover = true }: RowActionsProps) {
  // For mobile or compact view, use dropdown
  const mobileActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={(e) => { e.stopPropagation(); action.onClick(); }}
            className={action.variant === "destructive" ? "text-destructive" : ""}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // For desktop, show inline buttons on hover
  const desktopActions = (
    <div
      className={`hidden md:flex gap-1 justify-end transition-opacity ${
        showOnHover ? "opacity-0 group-hover:opacity-100" : ""
      }`}
    >
      {actions.map((action) => (
        <IconButton
          key={action.label}
          tooltip={action.label}
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); action.onClick(); }}
        >
          <action.icon
            className={`h-3.5 w-3.5 ${
              action.variant === "destructive" ? "text-destructive" : ""
            }`}
          />
        </IconButton>
      ))}
    </div>
  );

  return (
    <>
      {mobileActions}
      {desktopActions}
    </>
  );
}

// Pre-built action creators for common use cases
export function createViewAction(onClick: () => void): RowAction {
  return { label: "Ver", icon: Eye, onClick };
}

export function createEditAction(onClick: () => void): RowAction {
  return { label: "Editar", icon: Edit, onClick };
}

export function createDeleteAction(onClick: () => void): RowAction {
  return { label: "Eliminar", icon: Trash2, onClick, variant: "destructive" };
}
