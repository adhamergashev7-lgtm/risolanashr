"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, tint } from "@/lib/utils";
import type { Lead, Stage } from "@/types/lead";
import { LeadCard, type LeadActions } from "./lead-card";

export interface StageActions {
  onAddLead: (stage: Stage) => void;
  onEditStage: (stage: Stage) => void;
  onMoveStage: (stage: Stage, dir: -1 | 1) => void;
  onDeleteStage: (stage: Stage) => void;
  onAddStage: () => void;
}

/** Yacheykalar (Kanban): har bir bosqich — ustun, lidni sudrab boshqa ustunga o'tkazish mumkin */
export function KanbanBoard({
  stages,
  leads,
  actions,
  stageActions,
}: {
  stages: Stage[];
  leads: Lead[];
  actions: LeadActions;
  stageActions: StageActions;
}) {
  const [over, setOver] = useState<string | null>(null);
  const movable = stages.filter((s) => s.key !== "deleted"); // stages allaqachon sortStages bilan tartiblangan

  return (
    <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:snap-none sm:px-0">
      {stages.map((stage) => {
        const items = leads.filter((l) => l.stage_id === stage.id);
        const idx = movable.findIndex((s) => s.id === stage.id);
        const isDeleted = stage.key === "deleted";
        return (
          <section
            key={stage.id}
            aria-label={stage.name}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage.id);
            }}
            onDragLeave={() => setOver((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/lead-id");
              const lead = leads.find((l) => l.id === id);
              if (lead && lead.stage_id !== stage.id) actions.onMove(lead, stage.id);
            }}
            className={cn(
              "flex w-[84vw] max-w-[310px] shrink-0 snap-start flex-col rounded-3xl border border-transparent bg-[#EEF3EF] p-2 transition-colors sm:w-[290px]",
              over === stage.id && "border-qiymat bg-sage-40",
              isDeleted && "bg-[#F1F2F2]",
            )}
          >
            <header className="flex items-center gap-2 px-2 pb-2 pt-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
              <h3 className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-graphite" title={stage.name}>
                {stage.name}
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold tabular"
                style={{ color: stage.color, backgroundColor: tint(stage.color, 0.12) }}
              >
                {items.length}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${stage.name}: sozlamalar`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{stage.name}</DropdownMenuLabel>
                  {!isDeleted && (
                    <DropdownMenuItem onSelect={() => stageActions.onAddLead(stage)}>
                      <Plus /> Lid qo&apos;shish
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => stageActions.onEditStage(stage)}>
                    <Pencil /> Nomi va rangi
                  </DropdownMenuItem>
                  {!isDeleted && (
                    <>
                      <DropdownMenuItem disabled={idx <= 0} onSelect={() => stageActions.onMoveStage(stage, -1)}>
                        <ChevronLeft /> Chapga surish
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={idx >= movable.length - 1} onSelect={() => stageActions.onMoveStage(stage, 1)}>
                        <ChevronRight /> O&apos;ngga surish
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  {stage.key ? (
                    <DropdownMenuItem disabled>
                      <Lock /> Tizim yacheykasi
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => stageActions.onDeleteStage(stage)} className="text-danger focus:text-danger">
                      <Trash2 /> Yacheykani o&apos;chirish
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            <div className="scrollbar-thin flex max-h-[calc(100dvh-300px)] min-h-[140px] flex-col gap-2 overflow-y-auto px-0.5 pb-1">
              {items.map((lead) => (
                <LeadCard key={lead.id} lead={lead} stage={stage} stages={stages} actions={actions} draggable />
              ))}
              {items.length === 0 && (
                <p className="rounded-2xl border border-dashed border-sage-60 px-3 py-8 text-center text-xs text-graphite-80">
                  {isDeleted ? "O'chirilgan lidlar shu yerda" : "Lidni shu yerga sudrab tashlang"}
                </p>
              )}
            </div>

            {!isDeleted && (
              <button
                type="button"
                onClick={() => stageActions.onAddLead(stage)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-graphite-80 transition-colors hover:bg-white hover:text-qiymat"
              >
                <Plus className="h-4 w-4" /> Lid qo&apos;shish
              </button>
            )}
          </section>
        );
      })}

      <button
        type="button"
        onClick={stageActions.onAddStage}
        className="flex w-[84vw] max-w-[310px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-qiymat-60 p-6 text-qiymat transition-colors hover:border-qiymat hover:bg-sage-40 sm:w-[240px]"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-qiymat text-white">
          <Plus className="h-5 w-5" />
        </span>
        <span className="font-display text-sm font-semibold">Yacheyka qo&apos;shish</span>
        <span className="text-center text-xs text-graphite-80">Yangi bosqich (ustun) yarating</span>
      </button>
    </div>
  );
}
