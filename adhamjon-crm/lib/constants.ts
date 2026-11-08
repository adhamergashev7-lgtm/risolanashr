/** Lid manbalari */
export const SOURCES = ["instagram", "telegram", "sayt", "qongiroq", "dokon", "tavsiya", "boshqa"] as const;
export type LeadSource = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  sayt: "Sayt formasi",
  qongiroq: "Kiruvchi qo'ng'iroq",
  dokon: "Do'kon (tashrif)",
  tavsiya: "Tavsiya",
  boshqa: "Boshqa",
};

export function sourceLabel(source: string) {
  return SOURCE_LABELS[source as LeadSource] ?? source;
}

/**
 * Tizim yacheykalari (bosqichlar). `key` orqali kod ularni taniydi (statistika, o'chirish),
 * nomi va rangini admin o'zgartira oladi. Kalitli yacheykalarni o'chirib bo'lmaydi.
 */
export type StageKey = "new" | "callback" | "informed" | "invited" | "bought" | "not_bought" | "mib_debt" | "no_answer" | "deleted";

export const DEFAULT_STAGES: { key: StageKey; name: string; color: string }[] = [
  { key: "new", name: "Yangi lidlar", color: "#0E5A4D" },
  { key: "callback", name: "Qayta qo'ng'iroq", color: "#C2410C" },
  { key: "informed", name: "Ma'lumot berildi", color: "#1D4ED8" },
  { key: "invited", name: "Do'konga chaqirildi", color: "#0E7490" },
  { key: "bought", name: "Sotib oldi", color: "#15803D" },
  { key: "not_bought", name: "Sotib olmadi", color: "#B91C1C" },
  { key: "mib_debt", name: "MIBdan qarzi bor", color: "#A16207" },
  { key: "no_answer", name: "Ko'tarmadi", color: "#64748B" },
  { key: "deleted", name: "O'chirilgan", color: "#4E5759" },
];

/** Yangi yacheyka uchun rang tanlovi (oq fonda matn sifatida ≥4.5:1) */
export const STAGE_COLORS = [
  "#0E5A4D",
  "#23463F",
  "#15803D",
  "#0E7490",
  "#1D4ED8",
  "#6D28D9",
  "#BE185D",
  "#B91C1C",
  "#C2410C",
  "#A16207",
  "#64748B",
  "#4E5759",
];

export const PHONE_REGEX = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;
