"use client";

import { useState } from "react";
import { STATUSES, STATUS_META, type LeadStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import { LeadCard, type LeadActions } from "./lead-card";

export function KanbanBoard({ leads, actions }: { leads: Lead[]; actions: LeadActions }) {
  const [over, setOver] = useState<LeadStatus | null>(null);

  return (
    <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      {STATUSES.map((status) => {
        const items = leads.filter((l) => l.status === status);
        const meta = STATUS_META[status];
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/lead-id");
              const lead = leads.find((l) => l.id === id);
              if (lead && lead.status !== status) actions.onStatusChange(lead, status);
            }}
            className={cn(
              "flex w-[82vw] max-w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-white/[0.015] p-2 transition-colors sm:w-[300px]",
              over === status && "border-primary/60 bg-lime-soft",
            )}
          >
            <header className="flex items-center justify-between px-2 py-2">
              <span className="flex items-center gap-2 text-sm font-bold">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-semibold tabular">{items.length}</span>
            </header>
            <div className="flex min-h-[120px] flex-col gap-2">
              {items.map((lead) => (
                <LeadCard key={lead.id} lead={lead} actions={actions} compact draggable />
              ))}
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                  Lid yo&apos;q
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
