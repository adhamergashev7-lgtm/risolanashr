"use client";

import { Columns3, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOURCES, SOURCE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type SortKey = "newest" | "reminder" | "name";
export type ViewMode = "kanban" | "list";

export interface ToolbarState {
  query: string;
  source: string; // "all" yoki manba
  sort: SortKey;
}

export function Toolbar({
  value,
  onChange,
  view,
  onViewChange,
}: {
  value: ToolbarState;
  onChange: (v: ToolbarState) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}) {
  const set = <K extends keyof ToolbarState>(k: K, v: ToolbarState[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-80" />
        <Input
          value={value.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Ism, telefon yoki mahsulot bo'yicha qidirish"
          className="h-11 rounded-full pl-11 pr-10"
          aria-label="Qidiruv"
        />
        {value.query && (
          <button
            type="button"
            onClick={() => set("query", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-graphite-80 hover:bg-accent"
            aria-label="Qidiruvni tozalash"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
        <Select value={value.source} onValueChange={(v) => set("source", v)}>
          <SelectTrigger className="h-11 rounded-full sm:w-44" aria-label="Manba">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha manbalar</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.sort} onValueChange={(v) => set("sort", v as SortKey)}>
          <SelectTrigger className="h-11 rounded-full sm:w-44" aria-label="Saralash">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Yangi kelgan</SelectItem>
            <SelectItem value="reminder">Eslatma vaqti</SelectItem>
            <SelectItem value="name">Ism (A–Z)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex h-11 items-center rounded-full border border-border bg-white p-1" role="group" aria-label="Ko'rinish">
          {(
            [
              ["kanban", Columns3, "Yacheykalar"],
              ["list", List, "Ro'yxat"],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewChange(mode)}
              className={cn(
                "flex h-full items-center rounded-full px-3 transition-colors",
                view === mode ? "bg-qiymat text-white" : "text-graphite-80 hover:text-qiymat",
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
  );
}
