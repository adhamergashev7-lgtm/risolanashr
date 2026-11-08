"use client";

import { BellRing, Eye, MoreHorizontal, Pencil, Phone, RotateCcw, Send, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sourceLabel } from "@/lib/constants";
import { cn, formatMoney, phoneHref } from "@/lib/utils";
import type { Lead, Stage } from "@/types/lead";
import { StagePill } from "./stage-pill";
import { ReminderBadge, TimeText } from "./time-text";

export interface LeadActions {
  onOpen: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onMove: (lead: Lead, stageId: string) => void;
  onArchive: (lead: Lead) => void;
  onRestore: (lead: Lead) => void;
  onDestroy: (lead: Lead) => void;
  onResend?: (lead: Lead) => void;
}

export function LeadCard({
  lead,
  stage,
  stages,
  actions,
  draggable,
}: {
  lead: Lead;
  stage: Stage | undefined;
  stages: Stage[];
  actions: LeadActions;
  draggable?: boolean;
}) {
  const isDeleted = stage?.key === "deleted";
  const isNew = !lead.viewed_at && !isDeleted;

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-3.5 shadow-[0_1px_2px_rgba(34,45,47,0.04)] transition-colors hover:border-qiymat-60",
        draggable && "cursor-grab active:cursor-grabbing",
        isDeleted && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => actions.onOpen(lead)}
            className="flex max-w-full items-center gap-2 text-left font-display text-[15px] font-semibold leading-tight text-graphite hover:text-qiymat"
          >
            {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-qiymat" title="Hali ko'rilmagan" />}
            <span className="truncate">{lead.full_name}</span>
          </button>
          <a
            href={phoneHref(lead.phone)}
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-graphite-80 tabular transition-colors hover:text-qiymat"
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
            <DropdownMenuItem onSelect={() => actions.onEdit(lead)}>
              <Pencil /> Tahrirlash
            </DropdownMenuItem>
            {actions.onResend && (
              <DropdownMenuItem onSelect={() => actions.onResend?.(lead)}>
                <Send /> Telegramga yuborish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {isDeleted ? (
              <>
                <DropdownMenuItem onSelect={() => actions.onRestore(lead)}>
                  <RotateCcw /> Qayta tiklash
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onDestroy(lead)} className="text-danger focus:text-danger">
                  <Trash2 /> Butunlay o&apos;chirish
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={() => actions.onArchive(lead)} className="text-danger focus:text-danger">
                <Trash2 /> O&apos;chirish
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(lead.product || lead.amount != null) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {lead.product && (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-sage-40 px-2.5 py-1 text-xs font-semibold text-qiymat">
              <ShoppingBag className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.product}</span>
            </span>
          )}
          {lead.amount != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-graphite">
              <Wallet className="h-3 w-3" /> {formatMoney(lead.amount)} so&apos;m
            </span>
          )}
        </div>
      )}

      {lead.comment && <p className="line-clamp-2 text-xs leading-relaxed text-graphite-80">{lead.comment}</p>}

      {lead.reminder_at && !isDeleted && (
        <ReminderBadge value={lead.reminder_at} icon={<BellRing className="h-3 w-3" />} />
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <StagePill stage={stage} stages={stages} onChange={(id) => actions.onMove(lead, id)} />
        <div className="flex min-w-0 flex-col items-end text-right text-[11px] leading-tight text-graphite-80">
          <TimeText value={lead.created_at} format="ago" />
          <span className="truncate">{sourceLabel(lead.source)}</span>
        </div>
      </div>
    </article>
  );
}
