import { useState, useRef, useEffect } from "react";
import { Calendar, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate, dateToLocalString } from "@/utils/dateUtils";

interface EditableFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  onChange: (value: string) => void;
  type?: "text" | "select" | "date";
  options?: { value: string; label: string }[];
  icon?: React.ElementType;
  editable?: boolean;
  badge?: boolean;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  placeholder?: string;
}

export function EditableField({
  label,
  value,
  displayValue,
  onChange,
  type = "text",
  options = [],
  icon: Icon,
  editable = true,
  badge = false,
  badgeVariant = "secondary",
  placeholder,
}: EditableFieldProps) {
  const effectivePlaceholder = placeholder !== undefined
    ? placeholder
    : type === "select" ? "Seleccionar"
    : type === "date" ? "Sin fecha"
    : "—";
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const handleSelectChange = (newValue: string) => {
    onChange(newValue);
    setIsEditing(false);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Use local date formatting to avoid UTC timezone shift (Colombia is UTC-5)
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
    setIsEditing(false);
  };

  const renderValue = () => {
    const display = displayValue || value || effectivePlaceholder;
    const isEmpty = !value;

    if (badge && !isEmpty) {
      return (
        <Badge variant={badgeVariant} className="font-normal">
          {display}
        </Badge>
      );
    }

    return (
      <span className={cn(isEmpty && "text-muted-foreground italic")}>
        {display}
      </span>
    );
  };

  const renderEditableContent = () => {
    if (!editable) {
      return renderValue();
    }

    if (type === "text") {
      if (isEditing) {
        return (
          <Input
            ref={inputRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        );
      }
      return (
        <div
          onClick={() => setIsEditing(true)}
          className="cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 -mx-2 -my-1 transition-colors ring-1 ring-transparent hover:ring-border"
        >
          {renderValue()}
        </div>
      );
    }

    if (type === "select") {
      if (options.length >= 4) {
        return (
          <Combobox
            options={[...options]}
            value={value}
            onValueChange={(val) => handleSelectChange(val)}
            placeholder={effectivePlaceholder}
            className="h-8 text-sm border-none shadow-none hover:bg-accent hover:text-accent-foreground hover:ring-1 hover:ring-border px-2 -mx-2 transition-colors"
          />
        );
      }
      return (
        <Select value={value} onValueChange={handleSelectChange}>
          <SelectTrigger className="h-8 text-sm border-none shadow-none hover:bg-accent hover:text-accent-foreground hover:ring-1 hover:ring-border px-2 -mx-2 transition-colors">
            <SelectValue placeholder={effectivePlaceholder}>
              {badge && value ? (
                <Badge variant={badgeVariant} className="font-normal">
                  {displayValue || options.find(o => o.value === value)?.label || value}
                </Badge>
              ) : (
                displayValue || options.find(o => o.value === value)?.label || value || effectivePlaceholder
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent side="bottom">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === "date") {
      // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
      const dateValue = value ? (() => {
        const [y, m, d] = value.split("-").map(Number);
        return new Date(y, m - 1, d);
      })() : undefined;
      const displayDate = dateValue && !isNaN(dateValue.getTime())
        ? format(dateValue, "d 'de' MMMM, yyyy", { locale: es })
        : effectivePlaceholder;

      return (
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 -mx-2 -my-1 transition-colors ring-1 ring-transparent hover:ring-border">
              <span className={cn(!value && "text-muted-foreground italic")}>
                {displayDate}
              </span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateValue}
              onSelect={handleDateChange}
              defaultMonth={dateValue}
              initialFocus
              className="pointer-events-auto"
              captionLayout="dropdown-buttons"
              fromYear={1950}
              toYear={2040}
            />
          </PopoverContent>
        </Popover>
      );
    }

    return renderValue();
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm">{renderEditableContent()}</div>
    </div>
  );
}
