"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, FlaskConical, Inbox, Loader2, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Lead, Stage } from "@/types/lead";
import { BrandMark } from "./brand-logo";
import { KanbanBoard, type StageActions } from "./kanban-board";
import { LeadCard, type LeadActions } from "./lead-card";
import { LeadDialog } from "./lead-dialog";
import { LeadDrawer } from "./lead-drawer";
import { StageDialog } from "./stage-dialog";
import { StatsCards } from "./stats-cards";
import { Toolbar, type ToolbarState, type ViewMode } from "./toolbar";
import { useCrm } from "./use-crm";

const VIEW_KEY = "qiymat-crm:view";

export function Dashboard({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const crm = useCrm(userEmail);
  const { stages, leads, loading, store } = crm;
  const demo = store.mode === "demo";

  const [toolbar, setToolbar] = useState<ToolbarState>({ query: "", source: "all", sort: "newest" });
  const [view, setView] = useState<ViewMode>("kanban");
  const [listStage, setListStage] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [leadDialog, setLeadDialog] = useState<{ open: boolean; lead?: Lead | null; stageId?: string }>({ open: false });
  const [stageDialog, setStageDialog] = useState<{ open: boolean; stage?: Stage | null }>({ open: false });
  const [toDestroy, setToDestroy] = useState<Lead | null>(null);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [moveTo, setMoveTo] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "kanban" || saved === "list") setView(saved);
    } catch {
      /* localStorage yo'q */
    }
  }, []);

  const changeView = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* e'tiborsiz */
    }
  };

  const actions: LeadActions = useMemo(
    () => ({
      onOpen: (lead) => setOpenId(lead.id),
      onEdit: (lead) => setLeadDialog({ open: true, lead }),
      onMove: (lead, stageId) => void crm.moveLead(lead, stageId),
      onArchive: (lead) => void crm.archiveLead(lead),
      onRestore: (lead) => void crm.restoreLead(lead),
      onDestroy: (lead) => setToDestroy(lead),
      onResend: demo
        ? undefined
        : async (lead) => {
            const id = toast.loading("Telegramga yuborilmoqda...");
            try {
              const res = await fetch(`/api/leads/${lead.id}/telegram`, { method: "POST" });
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
              if (res.ok && data.ok) toast.success("Telegramga yuborildi", { id });
              else toast.error("Yuborib bo'lmadi", { id, description: data.error });
            } catch {
              toast.error("Tarmoq xatosi", { id });
            }
          },
    }),
    [crm, demo],
  );

  const stageActions: StageActions = {
    onAddLead: (stage) => setLeadDialog({ open: true, stageId: stage.id }),
    onEditStage: (stage) => setStageDialog({ open: true, stage }),
    onMoveStage: (stage, dir) => void crm.moveStage(stage, dir),
    onDeleteStage: (stage) => {
      setStageToDelete(stage);
      setMoveTo(crm.defaultStage?.id !== stage.id ? crm.defaultStage?.id ?? "" : stages.find((s) => s.id !== stage.id)?.id ?? "");
    },
    onAddStage: () => setStageDialog({ open: true, stage: null }),
  };

  // Qidiruv / filtr / saralash
  const filtered = useMemo(() => {
    const q = toolbar.query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const list = leads.filter((l) => {
      if (toolbar.source !== "all" && l.source !== toolbar.source) return false;
      if (!q) return true;
      if (l.full_name.toLowerCase().includes(q) || (l.product ?? "").toLowerCase().includes(q)) return true;
      return qDigits.length > 0 && l.phone.replace(/\D/g, "").includes(qDigits);
    });
    return list.sort((a, b) => {
      if (toolbar.sort === "name") return a.full_name.localeCompare(b.full_name);
      if (toolbar.sort === "reminder") {
        const ra = a.reminder_at ? +new Date(a.reminder_at) : Infinity;
        const rb = b.reminder_at ? +new Date(b.reminder_at) : Infinity;
        if (ra !== rb) return ra - rb;
      }
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  }, [leads, toolbar]);

  const deletedId = stages.find((s) => s.key === "deleted")?.id;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const l of filtered) {
      c[l.stage_id] = (c[l.stage_id] ?? 0) + 1;
      if (l.stage_id !== deletedId) c.all += 1;
    }
    return c;
  }, [filtered, deletedId]);

  const listItems = useMemo(
    () => (listStage === "all" ? filtered.filter((l) => l.stage_id !== deletedId) : filtered.filter((l) => l.stage_id === listStage)),
    [filtered, listStage, deletedId],
  );

  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);
  const openLead = openId ? leads.find((l) => l.id === openId) ?? null : null;

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4">
          <BrandMark />
          <div className="flex items-center gap-2">
            {demo && (
              <span className="hidden items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-warning sm:inline-flex">
                <FlaskConical className="h-3.5 w-3.5" /> Demo rejim
              </span>
            )}
            <span className="hidden max-w-[200px] truncate text-sm text-graphite-80 lg:inline">{userEmail}</span>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Ariza formasi
              </Link>
            </Button>
            {!demo && (
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Chiqish">
                <LogOut /> <span className="hidden sm:inline">Chiqish</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:py-8">
        {demo && (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-graphite">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              <b>Demo rejim.</b> Ma&apos;lumotlar faqat shu brauzerda saqlanadi. Jamoa bilan umumiy baza uchun Vercel&apos;ga
              Supabase kalitlarini qo&apos;shing (README).
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-qiymat sm:text-4xl">LIDLAR</h1>
            <p className="mt-1 text-sm text-graphite-80">Barcha mijozlar va ularning bosqichlari</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={stageActions.onAddStage}>
              <Plus /> Yacheyka
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setLeadDialog({ open: true, stageId: crm.defaultStage?.id })}>
              <Plus /> Yangi lid
            </Button>
          </div>
        </div>

        <StatsCards leads={leads} stages={stages} />

        <Toolbar value={toolbar} onChange={setToolbar} view={view} onViewChange={changeView} />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-graphite-80">
            <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
          </div>
        ) : view === "kanban" ? (
          <KanbanBoard stages={stages} leads={filtered} actions={actions} stageActions={stageActions} />
        ) : (
          <div className="space-y-4">
            <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {[{ id: "all", name: "Barchasi", color: "#0E5A4D" }, ...stages].map((s) => {
                const active = listStage === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setListStage(s.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                      active ? "border-qiymat bg-qiymat text-white" : "border-border bg-white text-graphite hover:border-qiymat-60",
                    )}
                  >
                    {s.id !== "all" && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "#fff" : s.color }} />}
                    {s.name}
                    <span className={cn("rounded-full px-1.5 text-xs tabular", active ? "bg-white/20" : "bg-sage-40 text-qiymat")}>
                      {counts[s.id] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
            {listItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {listItems.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} stage={stageById.get(lead.stage_id)} stages={stages} actions={actions} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-qiymat-60 bg-white px-6 py-16 text-center">
                <Inbox className="mb-3 h-10 w-10 text-qiymat-60" />
                <p className="font-display text-lg font-semibold text-qiymat">Lid topilmadi</p>
                <p className="mt-1 text-sm text-graphite-80">Filtrlarni o&apos;zgartiring yoki yangi lid qo&apos;shing</p>
              </div>
            )}
          </div>
        )}
      </main>

      <LeadDrawer
        lead={openLead}
        stages={stages}
        open={!!openLead}
        onOpenChange={(o) => !o && setOpenId(null)}
        actions={actions}
        store={store}
        onUpdate={crm.updateLead}
      />

      <LeadDialog
        open={leadDialog.open}
        onOpenChange={(o) => setLeadDialog((d) => ({ ...d, open: o }))}
        lead={leadDialog.lead}
        stages={stages}
        defaultStageId={leadDialog.stageId ?? crm.defaultStage?.id}
        onSubmit={async (input) => {
          if (leadDialog.lead) {
            const original = leadDialog.lead;
            const saved = await crm.updateLead(original, input, { success: "Saqlandi" });
            if (saved) void store.addActivity(original.id, "edited", "Ma'lumotlar tahrirlandi").catch(() => undefined);
            return saved;
          }
          return crm.createLead(input);
        }}
      />

      <StageDialog
        open={stageDialog.open}
        onOpenChange={(o) => setStageDialog((d) => ({ ...d, open: o }))}
        stage={stageDialog.stage}
        onSubmit={(v) => (stageDialog.stage ? crm.updateStage(stageDialog.stage, v) : crm.createStage(v))}
      />

      {/* Lidni butunlay o'chirish */}
      <AlertDialog open={!!toDestroy} onOpenChange={(o) => !o && setToDestroy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lidni butunlay o&apos;chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <b className="text-foreground">{toDestroy?.full_name}</b> va uning butun tarixi o&apos;chiriladi. Bu amalni qaytarib
              bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDestroy) {
                  if (openId === toDestroy.id) setOpenId(null);
                  void crm.destroyLead(toDestroy);
                }
                setToDestroy(null);
              }}
            >
              Butunlay o&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Yacheykani o'chirish */}
      <AlertDialog open={!!stageToDelete} onOpenChange={(o) => !o && setStageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>&quot;{stageToDelete?.name}&quot; yacheykasini o&apos;chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Undagi {leads.filter((l) => l.stage_id === stageToDelete?.id).length} ta lid tanlangan yacheykaga ko&apos;chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={moveTo} onValueChange={setMoveTo}>
            <SelectTrigger aria-label="Lidlar ko'chiriladigan yacheyka">
              <SelectValue placeholder="Yacheykani tanlang" />
            </SelectTrigger>
            <SelectContent>
              {stages
                .filter((s) => s.id !== stageToDelete?.id)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              disabled={!moveTo}
              onClick={() => {
                const target = stages.find((s) => s.id === moveTo);
                if (stageToDelete && target) void crm.deleteStage(stageToDelete, target);
                setStageToDelete(null);
              }}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
