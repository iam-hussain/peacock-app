"use client";

import * as React from "react";

import { cn } from "@/lib/ui/utils";

export interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value?: string;
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const prefix = "+91";
    const displayValue = value.startsWith(prefix)
      ? value.slice(prefix.length)
      : value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
      // Limit to exactly 10 digits
      const limitedValue = inputValue.slice(0, 10);
      const fullValue = limitedValue ? `${prefix}${limitedValue}` : "";
      onChange?.(fullValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className="relative flex items-center">
        <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none">
          {prefix}
        </span>
        <input
          type="tel"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent pl-12 pr-3 py-1 text-base md:text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="1234567890"
          minLength={10}
          maxLength={10}
          pattern="[0-9]{10}"
          {...props}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
