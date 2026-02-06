import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  // Navigation
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  // Expansion
  expanded?: boolean;
  onExpandToggle?: () => void;
  // Content
  children: React.ReactNode;
  footer?: React.ReactNode;
  countLabel?: string;
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  currentIndex,
  totalCount,
  onNavigate,
  expanded = false,
  onExpandToggle,
  children,
  footer,
  countLabel = "registros",
}: DetailSheetProps) {
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalCount - 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size={expanded ? "expanded" : "default"}
        hideCloseButton
        transparentOverlay
        className="flex flex-col p-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {currentIndex + 1} de {totalCount} {countLabel}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Navigation */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canGoPrev}
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canGoNext}
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Expand */}
            {onExpandToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onExpandToggle}
              >
                {expanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {children}
          </div>
        </ScrollArea>

        {/* Footer */}
        {footer && (
          <div className="border-t px-6 py-4">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Section component for grouping fields
interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
