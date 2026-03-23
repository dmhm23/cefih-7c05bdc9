import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  maxSize?: number;
  /** Currently selected file (controlled) */
  file?: File | null;
  /** Clear callback when file is removed */
  onClear?: () => void;
  /** Label text */
  label?: string;
  /** Hint text below the drop area */
  hint?: string;
  /** Compact inline style (small button) vs full drop zone */
  compact?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const truncateFileName = (name: string, maxLen = 30): string => {
  if (name.length <= maxLen) return name;
  const dotIdx = name.lastIndexOf(".");
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const available = maxLen - ext.length - 1; // 1 for "…"
  if (available < 4) return name.slice(0, maxLen - 1) + "…";
  return base.slice(0, available) + "…" + ext;
};

export function FileDropZone({
  onFile,
  accept,
  disabled,
  maxSize,
  file,
  onClear,
  label = "Arrastra un archivo aquí o haz clic para seleccionar",
  hint,
  compact,
  className,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptExtensions = accept
    ?.split(",")
    .map((s) => s.trim().toLowerCase())
    ?? [];

  const isAccepted = (f: File) => {
    if (acceptExtensions.length === 0) return true;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    const mime = f.type.toLowerCase();
    return acceptExtensions.some(
      (a) => a === ext || a === mime || (a.endsWith("/*") && mime.startsWith(a.replace("/*", "/")))
    );
  };

  const processFile = useCallback(
    (f: File) => {
      if (!isAccepted(f)) return;
      if (maxSize && f.size > maxSize) return;
      onFile(f);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFile, maxSize, accept]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  // Show selected file preview
  if (file) {
    return (
      <div className={cn("flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/20 min-w-0 overflow-hidden", className)}>
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm flex-1 truncate min-w-0">{file.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
        {onClear && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClear}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(isDragging && "ring-2 ring-primary ring-offset-1 rounded-md", className)}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          {label}
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <Upload className={cn("h-8 w-8 mx-auto mb-2", isDragging ? "text-primary" : "text-muted-foreground/40")} />
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground/70 mt-1">{hint}</p>}
    </div>
  );
}
