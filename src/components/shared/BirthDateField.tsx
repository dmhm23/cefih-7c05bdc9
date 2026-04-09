import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, subYears } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateToLocalString, parseLocalDate } from "@/utils/dateUtils";

interface BirthDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function BirthDateField({
  value,
  onChange,
  placeholder = "Seleccionar fecha de nacimiento",
  className,
  disabled,
  id,
}: BirthDateFieldProps) {
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => subYears(today, 90), [today]);
  const maxDate = useMemo(() => subYears(today, 18), [today]);
  const fromYear = minDate.getFullYear();
  const toYear = maxDate.getFullYear();

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(maxDate);
  const [yearSearch, setYearSearch] = useState("");
  const [yearPopoverOpen, setYearPopoverOpen] = useState(false);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const dateValue = parseLocalDate(value);

  const displayDate = dateValue
    ? format(dateValue, "d 'de' MMMM, yyyy", { locale: es })
    : null;

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = toYear; y >= fromYear; y--) arr.push(y);
    return arr;
  }, [fromYear, toYear]);

  const filteredYears = useMemo(() => {
    if (!yearSearch) return years;
    return years.filter((y) => y.toString().includes(yearSearch));
  }, [years, yearSearch]);

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(dateToLocalString(date));
      }
      setOpen(false);
    },
    [onChange],
  );

  const handleYearSelect = useCallback(
    (year: number) => {
      setMonth(new Date(year, month.getMonth(), 1));
      setYearPopoverOpen(false);
      setYearSearch("");
    },
    [month],
  );

  const handleMonthSelect = useCallback(
    (monthIdx: string) => {
      setMonth(new Date(month.getFullYear(), parseInt(monthIdx), 1));
    },
    [month],
  );

  const handlePrevMonth = useCallback(() => {
    setMonth((prev) => {
      const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return d < minDate ? prev : d;
    });
  }, [minDate]);

  const handleNextMonth = useCallback(() => {
    setMonth((prev) => {
      const d = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return d > maxDate ? prev : d;
    });
  }, [maxDate]);

  useEffect(() => {
    if (yearPopoverOpen) {
      setTimeout(() => yearInputRef.current?.focus(), 50);
    }
  }, [yearPopoverOpen]);

  // Sync month when opening with an existing value
  useEffect(() => {
    if (open && dateValue) {
      setMonth(dateValue);
    } else if (open && !dateValue) {
      setMonth(maxDate);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {displayDate ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Custom caption */}
        <div className="flex items-center justify-between gap-1 border-b border-border px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Month selector */}
          <Select
            value={month.getMonth().toString()}
            onValueChange={handleMonthSelect}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs border-none shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_ES.map((m, i) => (
                <SelectItem key={i} value={i.toString()} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year selector with search */}
          <Popover open={yearPopoverOpen} onOpenChange={setYearPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs font-medium"
              >
                {month.getFullYear()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[140px] p-2" align="center">
              <Input
                ref={yearInputRef}
                placeholder="Buscar año..."
                value={yearSearch}
                onChange={(e) => setYearSearch(e.target.value)}
                className="h-7 text-xs mb-2"
              />
              <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                {filteredYears.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Sin resultados
                  </p>
                )}
                {filteredYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={cn(
                      "w-full rounded px-2 py-1 text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                      y === month.getFullYear() &&
                        "bg-primary text-primary-foreground",
                    )}
                    onClick={() => handleYearSelect(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <DayPicker
          mode="single"
          locale={es}
          selected={dateValue}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          disabled={(date) => date < minDate || date > maxDate}
          showOutsideDays={false}
          className="p-3 pointer-events-auto"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
