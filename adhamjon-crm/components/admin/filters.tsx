"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_TYPES, STATUSES, STATUS_META, type LeadStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type StatusFilter = LeadStatus | "all";
export type SortKey = "newest" | "score";
export type ViewMode = "list" | "kanban";

export interface FiltersState {
  status: StatusFilter;
  business: string; // "all" yoki biznes turi
  query: string;
  sort: SortKey;
}

export function Filters({
  value,
  onChange,
  counts,
  view,
  onViewChange,
}: {
  value: FiltersState;
  onChange: (v: FiltersState) => void;
  counts: Record<StatusFilter, number>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}) {
  const set = <K extends keyof FiltersState>(k: K, v: FiltersState[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      {/* Status tablari */}
      <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {(["all", ...STATUSES] as StatusFilter[]).map((s) => {
          const active = value.status === s;
          const label = s === "all" ? "Barchasi" : STATUS_META[s].label;
          return (
            <button
              key={s}
              type="button"
              onClick={() => set("status", s)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular",
                  active ? "bg-black/15" : "bg-white/[0.06] text-foreground/80",
                )}
              >
                {counts[s] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish"
            className="h-11 pl-10 pr-9"
            aria-label="Qidiruv"
          />
          {value.query && (
            <button
              type="button"
              onClick={() => set("query", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Qidiruvni tozalash"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
          <Select value={value.business} onValueChange={(v) => set("business", v)}>
            <SelectTrigger className="h-11 sm:w-44" aria-label="Biznes turi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha bizneslar</SelectItem>
              {BUSINESS_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={value.sort} onValueChange={(v) => set("sort", v as SortKey)}>
            <SelectTrigger className="h-11 sm:w-44" aria-label="Saralash">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Yangi kelgan</SelectItem>
              <SelectItem value="score">Ball bo&apos;yicha</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex h-11 items-center rounded-xl border border-border bg-card p-1" role="group" aria-label="Ko'rinish">
            {(
              [
                ["list", List, "Ro'yxat"],
                ["kanban", LayoutGrid, "Kanban"],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewChange(mode)}
                className={cn(
                  "flex h-full items-center rounded-lg px-2.5 transition-colors",
                  view === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={label}
                aria-pressed={view === mode}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
