"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUSES, STATUS_META, type LeadStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", className)}
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

/** Status pill — bosilganda status tanlash menyusi ochiladi */
export function StatusPill({
  status,
  onChange,
  disabled,
}: {
  status: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
        style={{ color: meta.color, backgroundColor: meta.bg }}
        aria-label={`Status: ${meta.label}. O'zgartirish`}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
        {meta.label}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Statusni o&apos;zgartirish</DropdownMenuLabel>
        {STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => s !== status && onChange(s)}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[s].color }} />
            <span className="flex-1">{STATUS_META[s].label}</span>
            {s === status && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
