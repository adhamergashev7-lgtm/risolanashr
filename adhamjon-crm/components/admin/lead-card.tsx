"use client";

import { ArrowRight, Eye, MoreHorizontal, Phone, Send, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BUDGET_LABELS, STATUS_META, nextStatus, type LeadStatus } from "@/lib/constants";
import { cn, phoneHref } from "@/lib/utils";
import type { Lead } from "@/types/lead";
import { ScoreBar } from "./score-bar";
import { StatusPill } from "./status-pill";
import { TimeText } from "./time-text";

export interface LeadActions {
  onOpen: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
  onAdvance: (lead: Lead) => void;
  onResend: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadCard({
  lead,
  actions,
  compact,
  draggable,
}: {
  lead: Lead;
  actions: LeadActions;
  compact?: boolean;
  draggable?: boolean;
}) {
  const next = nextStatus(lead.status);
  const isNew = !lead.viewed_at;

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => actions.onOpen(lead)}
            className="flex max-w-full items-center gap-2 text-left font-display text-base font-bold leading-tight hover:text-primary"
          >
            {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" title="Hali ko'rilmagan" />}
            <span className="truncate">{lead.full_name}</span>
          </button>
          <a
            href={phoneHref(lead.phone)}
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular transition-colors hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </a>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-1.5 -mt-1 h-8 w-8 shrink-0" aria-label="Amallar">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => actions.onOpen(lead)}>
              <Eye /> Batafsil ko&apos;rish
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!next} onSelect={() => actions.onAdvance(lead)}>
              <ArrowRight /> {next ? `Oldinga: ${STATUS_META[next].label}` : "Statusni oldinga surish"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onResend(lead)}>
              <Send /> Telegramga qayta yuborish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => actions.onDelete(lead)} className="text-danger focus:text-danger">
              <Trash2 /> O&apos;chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-xs font-semibold">
          {lead.business_type}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Wallet className="h-3 w-3" /> {BUDGET_LABELS[lead.monthly_budget]}
        </span>
      </div>

      {!compact && lead.problems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lead.problems.map((p) => (
            <span key={p} className="rounded-md bg-lime-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
              {p}
            </span>
          ))}
        </div>
      )}

      <ScoreBar score={lead.score} />

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <StatusPill status={lead.status} onChange={(s) => actions.onStatusChange(lead, s)} />
        <div className="flex items-center gap-1">
          <TimeText value={lead.created_at} format="ago" className="text-xs text-muted-foreground" />
          {next && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => actions.onAdvance(lead)}
              aria-label={`Statusni oldinga surish: ${STATUS_META[next].label}`}
              title={`Oldinga: ${STATUS_META[next].label}`}
            >
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
