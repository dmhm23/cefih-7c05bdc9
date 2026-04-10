import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  max?: number;
  disabled?: boolean;
}

function formatCO(v: number): string {
  return v.toLocaleString("es-CO");
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = "0", id, className, max, disabled }, ref) => {
    const [display, setDisplay] = React.useState(() =>
      value != null && value > 0 ? formatCO(value) : ""
    );

    // Sync external value changes
    React.useEffect(() => {
      setDisplay(value != null && value > 0 ? formatCO(value) : "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      if (raw === "") {
        setDisplay("");
        onChange(undefined);
        return;
      }
      const num = Number(raw);
      if (max != null && num > max) return;
      setDisplay(formatCO(num));
      onChange(num);
    };

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
