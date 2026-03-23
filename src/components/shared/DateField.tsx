import { useState, useCallback } from "react";
import { Calendar as CalendarIcon, CircleDot } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dateToLocalString, parseLocalDate } from "@/utils/dateUtils";

interface DateFieldProps {
  /** YYYY-MM-DD string value */
  value: string;
  /** Called with YYYY-MM-DD string */
  onChange: (value: string) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Additional className for the trigger button */
  className?: string;
  /** Disable the field */
  disabled?: boolean;
  /** ID for form label association */
  id?: string;
  /** Compact variant for smaller spaces */
  compact?: boolean;
}

export function DateField({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled,
  id,
  compact,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(undefined);

  const dateValue = parseLocalDate(value);
  const displayDate = dateValue
    ? compact
      ? format(dateValue, "dd/MM/yyyy")
      : format(dateValue, "d 'de' MMMM, yyyy", { locale: es })
    : null;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(dateToLocalString(date));
    }
    setOpen(false);
  };

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    setMonth(today);
    onChange(dateToLocalString(today));
    setOpen(false);
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            compact ? "h-7 text-xs px-2" : "h-10 w-full",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className={cn("mr-2 shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
          {displayDate ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          defaultMonth={dateValue}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={1950}
          toYear={2040}
        />
      </PopoverContent>
    </Popover>
  );
}
