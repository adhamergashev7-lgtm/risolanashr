"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatUzPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

/** +998 XX XXX XX XX maskali telefon input */
export const PhoneInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & { value: string; onValueChange: (v: string) => void }
>(({ value, onValueChange, className, ...props }, ref) => (
  <Input
    ref={ref}
    type="tel"
    inputMode="tel"
    autoComplete="tel"
    placeholder="+998 90 123 45 67"
    value={value}
    onChange={(e) => onValueChange(formatUzPhone(e.target.value))}
    onFocus={(e) => {
      // kursorni oxiriga qo'yamiz — "+998 " prefiksi oldiga yozilib qolmasin
      const el = e.currentTarget;
      requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
    }}
    className={cn("tabular tracking-wide", className)}
    {...props}
  />
));
PhoneInput.displayName = "PhoneInput";
