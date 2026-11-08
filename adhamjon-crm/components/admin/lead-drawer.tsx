"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  BellRing,
  Eye,
  Loader2,
  MessageSquareText,
  Pencil,
  Phone,
  PhoneCall,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { sourceLabel } from "@/lib/constants";
import type { CrmStore } from "@/lib/store";
import { cn, formatDateTime, formatMoney, phoneHref, tint, toLocalInput } from "@/lib/utils";
import type { ActivityType, Lead, LeadActivity, LeadPatch, Stage } from "@/types/lead";
import type { LeadActions } from "./lead-card";
import { StagePill } from "./stage-pill";
import { ReminderBadge, TimeText } from "./time-text";

const ACTIVITY_META: Record<ActivityType, { icon: typeof Eye; title: string }> = {
  created: { icon: Sparkles, title: "Yaratildi" },
  viewed: { icon: Eye, title: "Ko'rildi" },
  stage_changed: { icon: ArrowRightLeft, title: "Yacheyka o'zgardi" },
  note: { icon: MessageSquareText, title: "Izoh" },
  call: { icon: PhoneCall, title: "Qo'ng'iroq qilindi" },
  reminder: { icon: BellRing, title: "Eslatma" },
  telegram_sent: { icon: Send, title: "Telegramga yuborildi" },
  edited: { icon: Pencil, title: "Tahrirlandi" },
};

interface Props {
  lead: Lead | null;
  stages: Stage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: LeadActions;
  store: CrmStore;
  onUpdate: (lead: Lead, patch: LeadPatch, opts?: { silent?: boolean; success?: string }) => Promise<Lead | null>;
}

export function LeadDrawer({ lead, stages, open, onOpenChange, actions, store, onUpdate }: Props) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const viewedRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  const leadId = lead?.id;

  const loadActivities = useCallback(async () => {
    if (!leadId) return;
    // Faqat eng oxirgi so'rov natijasi qo'llaniladi
    const reqId = ++requestRef.current;
    try {
      const data = await store.listActivities(leadId);
      if (reqId === requestRef.current) setActivities(data);
    } catch (e) {
      if (reqId === requestRef.current) toast.error("Tarixni yuklab bo'lmadi", { description: e instanceof Error ? e.message : "" });
    }
  }, [leadId, store]);

  useEffect(() => {
    if (!open || !lead) return;
    setNote("");
    setReminderOpen(false);
    setReminderAt(toLocalInput(lead.reminder_at));
    setLoading(true);
    setActivities([]);
    (async () => {
      if (!lead.viewed_at && viewedRef.current !== lead.id) {
        viewedRef.current = lead.id;
        await onUpdate(lead, { viewed_at: new Date().toISOString() }, { silent: true });
      }
      await loadActivities();
      setLoading(false);
    })();
    // faqat boshqa lid ochilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  // Lid o'zgarganda (yacheyka va h.k.) tarixni yangilash
  useEffect(() => {
    if (open && lead?.updated_at) void loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.updated_at, lead?.stage_id]);

  async function logActivity(type: ActivityType, message: string, meta?: Record<string, unknown>) {
    if (!lead) return false;
    try {
      const a = await store.addActivity(lead.id, type, message, meta);
      requestRef.current++; // yo'ldagi eski yuklash natijasi ustidan yozmasin
      setActivities((list) => (list.some((x) => x.id === a.id) ? list : [...list, a]));
      return true;
    } catch (e) {
      toast.error("Saqlab bo'lmadi", { description: e instanceof Error ? e.message : "" });
      return false;
    }
  }

  async function addNote() {
    const text = note.trim();
    if (!text) return;
    setSavingNote(true);
    const ok = await logActivity("note", text);
    setSavingNote(false);
    if (ok) {
      setNote("");
      toast.success("Izoh qo'shildi");
    }
  }

  async function saveReminder(value: string | null) {
    if (!lead) return;
    const iso = value ? new Date(value).toISOString() : null;
    const callback = stages.find((s) => s.key === "callback");
    const patch: LeadPatch = { reminder_at: iso };
    // Eslatma qo'yilsa va lid "Yangi"da bo'lsa — "Qayta qo'ng'iroq"ga o'tadi
    const current = stages.find((s) => s.id === lead.stage_id);
    if (iso && callback && current?.key === "new") patch.stage_id = callback.id;
    const saved = await onUpdate(lead, patch);
    if (!saved) return;
    await logActivity("reminder", iso ? `Qayta qo'ng'iroq: ${formatDateTime(iso)}` : "Eslatma olib tashlandi", { reminder_at: iso });
    await loadActivities();
    setReminderOpen(false);
    toast.success(iso ? "Eslatma qo'yildi" : "Eslatma olib tashlandi", { description: iso ? formatDateTime(iso) : undefined });
  }

  if (!lead) return null;
  const stage = stages.find((s) => s.id === lead.stage_id);
  const isDeleted = stage?.key === "deleted";
  const moveTargets = stages.filter((s) => s.key !== "deleted");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="lead-drawer-desc">
        <SheetHeader className="bg-qiymat qiymat-arcs text-white">
          <div className="flex items-center gap-2 text-xs text-sage-60">
            <TimeText value={lead.created_at} format="ago" /> · {sourceLabel(lead.source)}
          </div>
          <SheetTitle className="pt-1 text-2xl font-semibold text-white">{lead.full_name}</SheetTitle>
          <SheetDescription id="lead-drawer-desc" asChild>
            <a href={phoneHref(lead.phone)} className="w-fit text-base font-medium text-sage-60 tabular hover:text-white">
              {lead.phone}
            </a>
          </SheetDescription>
        </SheetHeader>

        <div className="scrollbar-thin min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden p-5">
          {/* Asosiy amallar */}
          <section className="grid grid-cols-2 gap-2 [&>*]:min-w-0">
            <Button asChild className="h-auto min-h-12 whitespace-normal py-2 text-center leading-tight">
              <a href={phoneHref(lead.phone)} onClick={() => void logActivity("call", `Qo'ng'iroq: ${lead.phone}`)}>
                <Phone /> Qo&apos;ng&apos;iroq qilish
              </a>
            </Button>
            <Button
              variant="secondary"
              className="h-auto min-h-12 whitespace-normal py-2 text-center leading-tight"
              onClick={() => setReminderOpen((v) => !v)}
            >
              <BellRing /> Eslatma qo&apos;yish
            </Button>
            {reminderOpen && (
              <div className="col-span-2 flex flex-col gap-2 rounded-2xl border border-border bg-[#F5F8F6] p-3 sm:flex-row">
                <Input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className="h-11"
                  aria-label="Eslatma vaqti"
                />
                <Button className="h-11" disabled={!reminderAt} onClick={() => saveReminder(reminderAt)}>
                  Saqlash
                </Button>
                {lead.reminder_at && (
                  <Button variant="ghost" className="h-11" onClick={() => saveReminder(null)} aria-label="Eslatmani olib tashlash">
                    <X /> Olib tashlash
                  </Button>
                )}
              </div>
            )}
            {lead.reminder_at && !isDeleted && <ReminderBadge value={lead.reminder_at} icon={<BellRing className="h-3 w-3" />} className="col-span-2" />}
          </section>

          {/* Yacheyka */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite-80">Yacheyka</h3>
            <div className="flex flex-wrap gap-2">
              {moveTargets.map((s) => {
                const active = s.id === lead.stage_id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => !active && actions.onMove(lead, s.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active ? "border-transparent text-white" : "border-border bg-white text-graphite hover:border-qiymat-60",
                    )}
                    style={active ? { backgroundColor: s.color } : undefined}
                  >
                    {!active && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />}
                    {s.name}
                  </button>
                );
              })}
            </div>
            {isDeleted && (
              <p className="mt-3 rounded-2xl px-3 py-2 text-sm" style={{ backgroundColor: tint(stage!.color, 0.1), color: stage!.color }}>
                Bu lid &quot;{stage!.name}&quot; yacheykasida.
              </p>
            )}
          </section>

          {/* Ma'lumotlar */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite-80">Ma&apos;lumotlar</h3>
              <Button variant="ghost" size="sm" onClick={() => actions.onEdit(lead)}>
                <Pencil /> Tahrirlash
              </Button>
            </div>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-white">
              <Row label="Telefon">
                <a href={phoneHref(lead.phone)} className="font-semibold tabular text-qiymat hover:underline">
                  {lead.phone}
                </a>
              </Row>
              <Row label="Qiziqish">{lead.product || "—"}</Row>
              <Row label="Summa">{lead.amount != null ? `${formatMoney(lead.amount)} so'm` : "—"}</Row>
              <Row label="Manba">{sourceLabel(lead.source)}</Row>
              <Row label="Yacheyka">
                <StagePill stage={stage} stages={stages} onChange={(id) => actions.onMove(lead, id)} />
              </Row>
              <Row label="Yaratilgan">
                <TimeText value={lead.created_at} />
              </Row>
              {lead.created_by && <Row label="Kim qo'shgan">{lead.created_by}</Row>}
            </dl>
            {lead.comment && (
              <div className="mt-3 rounded-2xl bg-sage-40/60 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-qiymat">Izoh</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-graphite">{lead.comment}</p>
              </div>
            )}
          </section>

          {/* Menejer izohi */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite-80">Izoh qo&apos;shish</h3>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Suhbat natijasi, keyingi qadam..."
              className="min-h-[90px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void addNote();
              }}
            />
            <Button className="mt-2 w-full" variant="secondary" disabled={!note.trim() || savingNote} onClick={addNote}>
              {savingNote ? <Loader2 className="animate-spin" /> : <MessageSquareText />} Izohni saqlash
            </Button>
          </section>

          {/* Tarix */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite-80">Tarix</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-graphite-80">
                <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-graphite-80">Hozircha yozuv yo&apos;q</p>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-sage-60 pl-6">
                {activities.map((a) => {
                  const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.note;
                  const Icon = meta.icon;
                  const to = stages.find((s) => s.id === a.meta?.to_id);
                  return (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[38px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-qiymat text-white">
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm font-semibold text-graphite">{meta.title}</p>
                        <TimeText value={a.created_at} className="text-xs text-graphite-80 tabular" />
                      </div>
                      {a.type === "stage_changed" ? (
                        <p className="mt-0.5 text-sm text-graphite-80">
                          {String(a.meta?.from ?? "—")} →{" "}
                          <span className="font-semibold" style={{ color: to?.color }}>
                            {String(a.meta?.to ?? "—")}
                          </span>
                        </p>
                      ) : a.type === "note" ? (
                        <p className="mt-1 whitespace-pre-wrap rounded-2xl bg-[#F5F8F6] px-3 py-2 text-sm text-graphite">{a.message}</p>
                      ) : a.type !== "created" && a.type !== "viewed" && a.message ? (
                        <p className="mt-0.5 text-sm text-graphite-80">{a.message}</p>
                      ) : null}
                      {a.author_email && <p className="mt-0.5 text-[11px] text-graphite-60">{a.author_email}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <footer className={cn("grid gap-2 border-t border-border p-4", actions.onResend ? "grid-cols-2" : "grid-cols-1")}>
          {actions.onResend && (
            <Button variant="outline" onClick={() => actions.onResend?.(lead)}>
              <Send /> Telegramga
            </Button>
          )}
          {isDeleted ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => actions.onRestore(lead)}>
                <RotateCcw /> Tiklash
              </Button>
              <Button variant="outline" className="border-danger/40 text-danger hover:text-danger" onClick={() => actions.onDestroy(lead)}>
                <Trash2 /> Butunlay
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="border-danger/40 text-danger hover:text-danger" onClick={() => actions.onArchive(lead)}>
              <Trash2 /> O&apos;chirish
            </Button>
          )}
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="shrink-0 text-graphite-80">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-graphite">{children}</dd>
    </div>
  );
}
