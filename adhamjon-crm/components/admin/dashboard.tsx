"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, LogOut, Plus } from "lucide-react";
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
import { STATUSES, STATUS_META, nextStatus, type LeadStatus } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Lead } from "@/types/lead";
import { Filters, type FiltersState, type StatusFilter, type ViewMode } from "./filters";
import { KanbanBoard } from "./kanban-board";
import { LeadCard, type LeadActions } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";
import { StatsCards } from "./stats-cards";

const VIEW_KEY = "crm:view";

export function Dashboard({
  initialLeads,
  userEmail,
  loadError,
}: {
  initialLeads: Lead[];
  userEmail: string;
  loadError?: string;
}) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filters, setFilters] = useState<FiltersState>({ status: "all", business: "all", query: "", sort: "newest" });
  const [view, setView] = useState<ViewMode>("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);

  useEffect(() => {
    if (loadError) toast.error("Lidlarni yuklab bo'lmadi", { description: loadError });
  }, [loadError]);

  // Ko'rinish rejimini eslab qolish (per-browser qulaylik)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "list" || saved === "kanban") setView(saved);
    } catch {
      /* localStorage mavjud emas */
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

  // Realtime: yangi lid kelsa yoki boshqa menejer o'zgartirsa — darhol ko'rinadi
  useEffect(() => {
    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const lead = payload.new as Lead;
          setLeads((prev) => (prev.some((l) => l.id === lead.id) ? prev : [lead, ...prev]));
          toast.success(`Yangi lid: ${lead.full_name}`, { description: `Ball: ${lead.score}/100` });
        } else if (payload.eventType === "UPDATE") {
          const lead = payload.new as Lead;
          setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...lead } : l)));
        } else if (payload.eventType === "DELETE") {
          const id = (payload.old as Partial<Lead>).id;
          if (id) setLeads((prev) => prev.filter((l) => l.id !== id));
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  /** Lidni yangilash (optimistik) */
  const updateLead = useCallback(
    async (lead: Lead, patch: Partial<Lead>) => {
      const prev = leads.find((l) => l.id === lead.id) ?? lead;
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, ...patch } : l)));
      const { data, error } = await supabase.from("leads").update(patch).eq("id", lead.id).select().single();
      if (error) {
        setLeads((ls) => ls.map((l) => (l.id === lead.id ? prev : l)));
        toast.error("O'zgartirib bo'lmadi", { description: error.message });
        return false;
      }
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? (data as Lead) : l)));
      return true;
    },
    [leads, supabase],
  );

  const changeStatus = useCallback(
    async (lead: Lead, status: LeadStatus) => {
      const ok = await updateLead(lead, { status });
      if (ok) toast.success(`Status: ${STATUS_META[status].label}`, { description: lead.full_name });
    },
    [updateLead],
  );

  const actions: LeadActions = useMemo(
    () => ({
      onOpen: (lead) => setOpenId(lead.id),
      onStatusChange: (lead, status) => void changeStatus(lead, status),
      onAdvance: (lead) => {
        const next = nextStatus(lead.status);
        if (next) void changeStatus(lead, next);
      },
      onResend: async (lead) => {
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
      onDelete: (lead) => setToDelete(lead),
    }),
    [changeStatus],
  );

  async function confirmDelete() {
    const lead = toDelete;
    if (!lead) return;
    setToDelete(null);
    if (openId === lead.id) setOpenId(null);
    const snapshot = leads;
    setLeads((ls) => ls.filter((l) => l.id !== lead.id));
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) {
      setLeads(snapshot);
      toast.error("O'chirib bo'lmadi", { description: error.message });
    } else {
      toast.success("Lid o'chirildi", { description: lead.full_name });
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // Filtr va saralash
  const baseFiltered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return leads.filter((l) => {
      if (filters.business !== "all" && l.business_type !== filters.business) return false;
      if (!q) return true;
      if (l.full_name.toLowerCase().includes(q)) return true;
      return qDigits.length > 0 && l.phone.replace(/\D/g, "").includes(qDigits);
    });
  }, [leads, filters.business, filters.query]);

  const counts = useMemo(() => {
    const c = { all: baseFiltered.length } as Record<StatusFilter, number>;
    for (const s of STATUSES) c[s] = 0;
    for (const l of baseFiltered) c[l.status] += 1;
    return c;
  }, [baseFiltered]);

  const visible = useMemo(() => {
    const list = filters.status === "all" ? baseFiltered : baseFiltered.filter((l) => l.status === filters.status);
    return [...list].sort((a, b) =>
      filters.sort === "score"
        ? b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at),
    );
  }, [baseFiltered, filters.status, filters.sort]);

  const openLead = openId ? leads.find((l) => l.id === openId) ?? null : null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-lg font-black text-primary-foreground">
              A
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-extrabold">Adhamjon CRM</p>
              <p className="text-xs text-muted-foreground">Lidlar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:inline">{userEmail}</span>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Plus /> Forma
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Chiqish">
              <LogOut /> <span className="hidden sm:inline">Chiqish</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Lidlar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Instagram bio formasidan kelgan arizalar</p>
          </div>
        </div>

        <StatsCards leads={leads} />

        <Filters value={filters} onChange={setFilters} counts={counts} view={view} onViewChange={changeView} />

        {view === "kanban" ? (
          <KanbanBoard leads={visible} actions={actions} />
        ) : visible.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((lead) => (
              <LeadCard key={lead.id} lead={lead} actions={actions} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-display text-lg font-bold">Lid topilmadi</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {leads.length === 0 ? "Forma orqali birinchi ariza kelishini kuting" : "Filtrlarni o'zgartirib ko'ring"}
            </p>
          </div>
        )}
      </main>

      <LeadDrawer
        lead={openLead}
        open={!!openLead}
        onOpenChange={(o) => !o && setOpenId(null)}
        actions={actions}
        userEmail={userEmail}
        onUpdate={updateLead}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lidni o&apos;chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <b className="text-foreground">{toDelete?.full_name}</b> va uning butun tarixi o&apos;chiriladi. Bu amalni
              qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>O&apos;chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
