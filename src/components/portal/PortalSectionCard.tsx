import { useState } from "react";
import { ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalSectionCardProps {
  title: string;
  icon?: React.ReactNode;
  status?: "complete" | "incomplete" | "info";
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function PortalSectionCard({
  title,
  icon,
  status = "info",
  defaultOpen = false,
  children,
  className,
}: PortalSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const statusIcon =
    status === "complete" ? (
      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
    ) : status === "incomplete" ? (
      <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))] shrink-0" />
    ) : null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
        status === "complete" && "border-[hsl(var(--success)/0.3)]",
        status === "incomplete" && "border-[hsl(var(--warning)/0.3)]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <span className="flex-1 text-sm font-medium text-foreground">
          {title}
        </span>
        {statusIcon}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}
