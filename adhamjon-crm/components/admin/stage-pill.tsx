"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, tint } from "@/lib/utils";
import type { Stage } from "@/types/lead";

export function StageDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}

/** Yacheyka pill — bosilganda lidni boshqa yacheykaga ko'chirish menyusi */
export function StagePill({
  stage,
  stages,
  onChange,
  size = "sm",
}: {
  stage: Stage | undefined;
  stages: Stage[];
  onChange: (stageId: string) => void;
  size?: "sm" | "md";
}) {
  const color = stage?.color ?? "#4E5759";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/40",
          size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        )}
        style={{ color, backgroundColor: tint(color, 0.1) }}
        aria-label={`Yacheyka: ${stage?.name ?? "—"}. O'zgartirish`}
      >
        <StageDot color={color} />
        <span className="truncate">{stage?.name ?? "—"}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel>Yacheykaga ko&apos;chirish</DropdownMenuLabel>
        {stages.map((s) => (
          <DropdownMenuItem key={s.id} onSelect={() => s.id !== stage?.id && onChange(s.id)}>
            <StageDot color={s.color} />
            <span className="flex-1">{s.name}</span>
            {s.id === stage?.id && <Check className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
