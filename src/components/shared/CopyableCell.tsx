import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CopyableCellProps {
  value: string;
  className?: string;
}

export function CopyableCell({ value, className }: CopyableCellProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("group/copy flex items-center gap-1", className)}>
      <span>{value}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover/copy:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{copied ? "¡Copiado!" : "Copiar"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
