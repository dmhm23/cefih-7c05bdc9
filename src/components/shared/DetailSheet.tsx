import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
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
  // Full screen navigation
  onFullScreen?: () => void;
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
  onFullScreen,
  children,
  footer,
  countLabel = "registros",
}: DetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalCount - 1;

  // Track when a Radix portal (dropdown/select/popover) is open
  const portalOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    // Watch for Radix portals appearing/disappearing
    const observer = new MutationObserver(() => {
      const hasOpenPortal = !!document.querySelector(
        '[data-radix-popper-content-wrapper], [data-radix-select-viewport], [role="listbox"], [role="menu"]'
      );
      portalOpenRef.current = hasOpenPortal;
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const handleClickOutside = (event: MouseEvent) => {
      // Skip if a Radix portal is currently open (dropdown dismissing)
      if (portalOpenRef.current) return;

      const target = event.target as HTMLElement;
      const isInSheet = sheetRef.current?.contains(target);
      
      if (!isInSheet) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetRef}
        side="right"
        hideCloseButton
        transparentOverlay
        preventCloseOnOutsideClick
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

            {/* Full Screen */}
            {onFullScreen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onFullScreen}
                title="Abrir en pantalla completa"
              >
                <Maximize2 className="h-4 w-4" />
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
