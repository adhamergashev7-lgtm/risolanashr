"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  Eye,
  Loader2,
  MessageSquareText,
  Phone,
  PhoneCall,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { BUDGET_LABELS, STATUS_META, nextStatus, type LeadStatus } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDateTime, phoneHref } from "@/lib/utils";
import type { ActivityType, Lead, LeadActivity } from "@/types/lead";
import type { LeadActions } from "./lead-card";
import { ScoreBar } from "./score-bar";
import { StatusPill } from "./status-pill";
import { TimeText } from "./time-text";

const ACTIVITY_META: Record<ActivityType, { icon: typeof Eye; color: string; title: string }> = {
  created: { icon: Sparkles, color: "#C6FF00", title: "Yaratildi" },
  viewed: { icon: Eye, color: "#38BDF8", title: "Ko'rildi" },
  status_changed: { icon: RefreshCw, color: "#F59E0B", title: "Status o'zgardi" },
  note: { icon: MessageSquareText, color: "#FFFFFF", title: "Izoh" },
  call: { icon: PhoneCall, color: "#22C55E", title: "Qo'ng'iroq qilindi" },
  meeting: { icon: CalendarClock, color: "#F59E0B", title: "Uchrashuv belgilandi" },
  telegram_sent: { icon: Send, color: "#38BDF8", title: "Telegramga yuborildi" },
};

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: LeadActions;
  userEmail: string;
  onUpdate: (lead: Lead, patch: Partial<Lead>) => Promise<boolean>;
}

export function LeadDrawer({ lead, open, onOpenChange, actions, userEmail, onUpdate }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingAt, setMeetingAt] = useState("");
  const viewedRef = useRef<string | null>(null);
  const requestRef = useRef(0);

  const leadId = lead?.id;

  const loadActivities = useCallback(async () => {
    if (!leadId) return;
    // Faqat eng oxirgi so'rov natijasi qo'llaniladi (eski javob yangisini ustidan yozmasin)
    const reqId = ++requestRef.current;
    const { data, error } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });
    if (reqId !== requestRef.current) return;
    if (error) {
      toast.error("Tarixni yuklab bo'lmadi", { description: error.message });
      return;
    }
    setActivities((data as LeadActivity[]) ?? []);
  }, [leadId, supabase]);

  // Drawer ochilganda: tarixni yuklash + birinchi marta ochilsa "Ko'rildi" deb belgilash
  useEffect(() => {
    if (!open || !lead) return;
    setNote("");
    setMeetingOpen(false);
    setMeetingAt("");
    setLoading(true);
    setActivities([]);

    (async () => {
      if (!lead.viewed_at && viewedRef.current !== lead.id) {
        viewedRef.current = lead.id;
        await onUpdate(lead, { viewed_at: new Date().toISOString() });
      }
      await loadActivities();
      setLoading(false);
    })();
    // faqat boshqa lid ochilganda qayta ishlaydi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  // Status yoki uchrashuv o'zgarganda tarixni yangilash
  useEffect(() => {
    if (open && lead?.updated_at) void loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.updated_at]);

  async function logActivity(type: ActivityType, message: string, meta?: Record<string, unknown>) {
    if (!lead) return false;
    const { data, error } = await supabase
      .from("lead_activities")
      .insert({ lead_id: lead.id, type, message, meta: meta ?? null, author_email: userEmail || null })
      .select()
      .single();
    if (error) {
      toast.error("Saqlab bo'lmadi", { description: error.message });
      return false;
    }
    requestRef.current++; // yo'ldagi eski yuklashni bekor qilamiz
    setActivities((a) => (a.some((x) => x.id === (data as LeadActivity).id) ? a : [...a, data as LeadActivity]));
    return true;
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

  async function scheduleMeeting() {
    if (!lead || !meetingAt) return;
    const date = new Date(meetingAt);
    if (Number.isNaN(date.getTime())) return;
    const ok = await onUpdate(lead, { meeting_at: date.toISOString(), status: "uchrashuv" });
    if (!ok) return;
    await logActivity("meeting", `Uchrashuv: ${formatDateTime(date)}`, { meeting_at: date.toISOString() });
    await loadActivities();
    setMeetingOpen(false);
    toast.success("Uchrashuv belgilandi", { description: formatDateTime(date) });
  }

  if (!lead) return null;
  const next = nextStatus(lead.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="lead-drawer-desc">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <StatusPill status={lead.status} onChange={(s: LeadStatus) => actions.onStatusChange(lead, s)} />
            <span className="text-xs text-muted-foreground">
              <TimeText value={lead.created_at} format="ago" />
            </span>
          </div>
          <SheetTitle className="pt-1">{lead.full_name}</SheetTitle>
          <SheetDescription id="lead-drawer-desc">
            {lead.business_type} · {BUDGET_LABELS[lead.monthly_budget]}
          </SheetDescription>
        </SheetHeader>

        <div className="scrollbar-thin min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden p-5">
          {/* Keyingi qadam */}
          <section className="grid grid-cols-2 gap-2 [&>*]:min-w-0">
            <Button asChild className="h-auto min-h-12 whitespace-normal py-2 text-center leading-tight">
              <a href={phoneHref(lead.phone)} onClick={() => void logActivity("call", `Qo'ng'iroq: ${lead.phone}`)}>
                <Phone /> Qo&apos;ng&apos;iroq qilish
              </a>
            </Button>
            <Button
              variant="secondary"
              className="h-auto min-h-12 whitespace-normal py-2 text-center leading-tight"
              onClick={() => setMeetingOpen((v) => !v)}
            >
              <CalendarPlus /> Uchrashuv belgilash
            </Button>
            {meetingOpen && (
              <div className="col-span-2 flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row">
                <Input
                  type="datetime-local"
                  value={meetingAt}
                  onChange={(e) => setMeetingAt(e.target.value)}
                  className="h-11"
                  aria-label="Uchrashuv vaqti"
                />
                <Button className="h-11" disabled={!meetingAt} onClick={scheduleMeeting}>
                  Saqlash
                </Button>
              </div>
            )}
            {next && (
              <Button
                variant="outline"
                className="col-span-2 h-auto min-h-11 whitespace-normal py-2 text-center"
                onClick={() => actions.onAdvance(lead)}
              >
                Statusni oldinga surish: {STATUS_META[next].label} <ArrowRight />
              </Button>
            )}
          </section>

          {/* Score */}
          <section className="rounded-2xl border border-border bg-background/50 p-4">
            <ScoreBar score={lead.score} size="lg" />
          </section>

          {/* Ma'lumotlar */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ma&apos;lumotlar</h3>
            <dl className="divide-y divide-border rounded-2xl border border-border">
              <Row label="Telefon">
                <a href={phoneHref(lead.phone)} className="font-semibold tabular text-primary hover:underline">
                  {lead.phone}
                </a>
              </Row>
              <Row label="Biznes turi">{lead.business_type}</Row>
              <Row label="Oylik byudjet">{BUDGET_LABELS[lead.monthly_budget]}</Row>
              <Row label="Muammolar">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {lead.problems.length ? (
                    lead.problems.map((p) => (
                      <span key={p} className="rounded-md bg-lime-soft px-2 py-0.5 text-[11px] font-bold uppercase text-primary">
                        {p}
                      </span>
                    ))
                  ) : (
                    "—"
                  )}
                </div>
              </Row>
              {lead.meeting_at && (
                <Row label="Uchrashuv">
                  <TimeText value={lead.meeting_at} className="font-semibold text-warning" />
                </Row>
              )}
              <Row label="Manba">{lead.source}</Row>
              <Row label="Yaratilgan">
                <TimeText value={lead.created_at} />
              </Row>
            </dl>
            {lead.comment && (
              <div className="mt-3 rounded-2xl border border-border bg-background/50 p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Mijoz izohi</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{lead.comment}</p>
              </div>
            )}
          </section>

          {/* Menejer izohi */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Izoh qo&apos;shish</h3>
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

          {/* Timeline */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tarix</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hozircha yozuv yo&apos;q</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-6">
                {activities.map((a) => {
                  const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.note;
                  const Icon = meta.icon;
                  const from = a.meta?.from as LeadStatus | undefined;
                  const to = a.meta?.to as LeadStatus | undefined;
                  return (
                    <li key={a.id} className="relative">
                      <span
                        className="absolute -left-[37px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card"
                        style={{ color: meta.color }}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm font-semibold">{meta.title}</p>
                        <TimeText value={a.created_at} className="text-xs text-muted-foreground tabular" />
                      </div>
                      {a.type === "status_changed" && from && to ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {STATUS_META[from]?.label ?? from} → <span style={{ color: STATUS_META[to]?.color }}>{STATUS_META[to]?.label ?? to}</span>
                        </p>
                      ) : a.type === "note" ? (
                        <p className="mt-1 whitespace-pre-wrap rounded-xl bg-white/[0.04] px-3 py-2 text-sm">{a.message}</p>
                      ) : a.type !== "created" && a.type !== "viewed" && a.message ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">{a.message}</p>
                      ) : null}
                      {a.author_email && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{a.author_email}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-border p-4">
          <Button variant="outline" onClick={() => actions.onResend(lead)}>
            <Send /> Telegramga
          </Button>
          <Button variant="outline" className="text-danger hover:text-danger" onClick={() => actions.onDelete(lead)}>
            <Trash2 /> O&apos;chirish
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
