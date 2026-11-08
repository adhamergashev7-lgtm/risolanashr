"use client";

import { DEFAULT_STAGES, type StageKey } from "@/lib/constants";
import type { ActivityType, Lead, LeadActivity, Stage } from "@/types/lead";
import type { ChangeEvent, CrmStore } from "./types";

/**
 * DEMO rejim: Supabase sozlanmaguncha ma'lumotlar shu brauzerning localStorage'ida saqlanadi.
 * Bazadagi trigger mantiqi (default yacheyka, timeline) shu yerda takrorlangan.
 */
const KEY = "qiymat-crm:demo:v1";
const DEMO_USER = "demo@qiymat.uz";

interface DB {
  stages: Stage[];
  leads: Lead[];
  activities: LeadActivity[];
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

function seed(): DB {
  const t = Date.now();
  const stages: Stage[] = DEFAULT_STAGES.map((s, i) => ({
    id: uid(),
    name: s.name,
    color: s.color,
    position: i,
    key: s.key,
    is_default: s.key === "new",
    created_at: new Date(t - 30 * 864e5).toISOString(),
  }));
  const byKey = (k: StageKey) => stages.find((s) => s.key === k)!.id;
  const samples: [string, string, string, string, string | null, number | null, StageKey, number][] = [
    ["Bilol - Dönerci Bilal", "+998 90 123 45 67", "Muzlatgich Artel", "instagram", null, null, "new", 2],
    ["Aziza Karimova", "+998 94 222 10 20", "Changyutgich", "sayt", "Kechqurun qo'ng'iroq qiling", null, "callback", 5],
    ["Xiyobon Family Cafe", "+998 93 765 43 21", "Konditsioner 12-lik", "telegram", "Nasiyaga olmoqchi", null, "informed", 24],
    ["Kilo Family Outlet", "+998 99 111 22 33", "Kir yuvish mashinasi", "instagram", "Shanba kuni keladi", null, "invited", 72],
    ["Dr. Sardor - Klinika", "+998 97 444 55 66", "Televizor 55\"", "tavsiya", null, 7_500_000, "bought", 144],
    ["Malika Yusupova", "+998 95 808 70 60", "Mikroto'lqinli pech", "instagram", "Narx qimmatlik qildi", null, "not_bought", 50],
    ["Rustam Aliyev", "+998 91 555 66 77", "Gaz plita", "dokon", "MIB tekshiruvida qarz chiqdi", null, "mib_debt", 30],
    ["Jasur Toshmatov", "+998 88 300 40 50", "Smartfon", "qongiroq", null, null, "no_answer", 20],
  ];
  const leads: Lead[] = samples.map(([full_name, phone, product, source, comment, amount, key, hours]) => ({
    id: uid(),
    full_name,
    phone,
    product,
    source,
    comment,
    amount,
    stage_id: byKey(key),
    reminder_at: key === "callback" ? new Date(t + 3 * 3600e3).toISOString() : null,
    viewed_at: key === "new" ? null : new Date(t - hours * 3600e3 + 600e3).toISOString(),
    created_by: null,
    created_at: new Date(t - hours * 3600e3).toISOString(),
    updated_at: null,
  }));
  const activities: LeadActivity[] = leads.map((l) => ({
    id: uid(),
    lead_id: l.id,
    type: "created",
    message: "Lid yaratildi",
    meta: { source: l.source },
    author_email: null,
    created_at: l.created_at,
  }));
  return { stages, leads, activities };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* localStorage mavjud emas */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* e'tiborsiz */
  }
}

const listeners = new Set<(e: ChangeEvent) => void>();
const emit = (e: ChangeEvent) => listeners.forEach((l) => l(e));

function log(db: DB, leadId: string, type: ActivityType, message: string | null, meta: Record<string, unknown> | null, author: string | null) {
  const a: LeadActivity = { id: uid(), lead_id: leadId, type, message, meta, author_email: author, created_at: nowIso() };
  db.activities.push(a);
  return a;
}

const defaultStageId = (db: DB) =>
  [...db.stages].sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.position - b.position)[0]?.id;

export function createLocalStore(): CrmStore {
  return {
    mode: "demo",

    async listStages() {
      return [...load().stages].sort((a, b) => a.position - b.position);
    },
    async listLeads() {
      return [...load().leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async createLead(input) {
      const db = load();
      const lead: Lead = {
        id: uid(),
        full_name: input.full_name,
        phone: input.phone,
        product: input.product ?? null,
        source: input.source,
        comment: input.comment ?? null,
        amount: input.amount ?? null,
        stage_id: input.stage_id || defaultStageId(db)!,
        reminder_at: input.reminder_at ?? null,
        viewed_at: null,
        created_by: DEMO_USER,
        created_at: nowIso(),
        updated_at: null,
      };
      db.leads.push(lead);
      log(db, lead.id, "created", "Lid yaratildi", { source: lead.source }, DEMO_USER);
      save(db);
      emit({ table: "leads", type: "INSERT", row: lead });
      return lead;
    },
    async updateLead(id, patch) {
      const db = load();
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lid topilmadi");
      const old = { ...lead };
      Object.assign(lead, patch, { updated_at: nowIso() });
      if (lead.viewed_at && !old.viewed_at) log(db, id, "viewed", "Menejer ko'rdi", null, DEMO_USER);
      if (lead.stage_id !== old.stage_id) {
        const name = (sid: string) => db.stages.find((s) => s.id === sid)?.name ?? null;
        log(db, id, "stage_changed", "Yacheyka o'zgardi", { from: name(old.stage_id), to: name(lead.stage_id), to_id: lead.stage_id }, DEMO_USER);
      }
      save(db);
      emit({ table: "leads", type: "UPDATE", row: lead });
      return lead;
    },
    async deleteLead(id) {
      const db = load();
      db.leads = db.leads.filter((l) => l.id !== id);
      db.activities = db.activities.filter((a) => a.lead_id !== id);
      save(db);
      emit({ table: "leads", type: "DELETE", id });
    },
    async listActivities(leadId) {
      return load()
        .activities.filter((a) => a.lead_id === leadId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    async addActivity(leadId, type, message, meta) {
      const db = load();
      const a = log(db, leadId, type, message, meta ?? null, DEMO_USER);
      save(db);
      return a;
    },
    async createStage({ name, color }) {
      const db = load();
      const stage: Stage = {
        id: uid(),
        name,
        color,
        position: Math.max(-1, ...db.stages.map((s) => s.position)) + 1,
        key: null,
        is_default: false,
        created_at: nowIso(),
      };
      db.stages.push(stage);
      save(db);
      emit({ table: "stages", type: "INSERT", row: stage });
      return stage;
    },
    async updateStage(id, patch) {
      const db = load();
      const stage = db.stages.find((s) => s.id === id);
      if (!stage) throw new Error("Yacheyka topilmadi");
      Object.assign(stage, patch);
      save(db);
      emit({ table: "stages", type: "UPDATE", row: stage });
      return stage;
    },
    async deleteStage(id, moveToId) {
      const db = load();
      const stage = db.stages.find((s) => s.id === id);
      if (stage?.key) throw new Error(`Tizim yacheykasini o'chirib bo'lmaydi: ${stage.name}`);
      for (const l of db.leads) {
        if (l.stage_id === id) {
          l.stage_id = moveToId;
          emit({ table: "leads", type: "UPDATE", row: l });
        }
      }
      db.stages = db.stages.filter((s) => s.id !== id);
      save(db);
      emit({ table: "stages", type: "DELETE", id });
    },
    subscribe(cb) {
      listeners.add(cb);
      // Boshqa tabda o'zgarsa — to'liq qayta yuklash signali
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) cb({ table: "all", type: "RELOAD" });
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
