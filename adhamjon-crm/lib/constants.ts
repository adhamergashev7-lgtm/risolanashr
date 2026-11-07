export const BUSINESS_TYPES = ["Restoran", "Do'kon", "Klinika", "Ishlab chiqarish", "Xizmat", "Boshqa"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUDGETS = ["5mln_gacha", "5_15mln", "15_30mln", "30mln_plus"] as const;
export type MonthlyBudget = (typeof BUDGETS)[number];

export const BUDGET_LABELS: Record<MonthlyBudget, string> = {
  "5mln_gacha": "5 mln so'mgacha",
  "5_15mln": "5–15 mln so'm",
  "15_30mln": "15–30 mln so'm",
  "30mln_plus": "30 mln so'mdan ko'p",
};

/**
 * "Taxminiy daromad" hisoblash uchun har bir byudjet oralig'ining o'rtacha qiymati (so'm).
 * Daromad = (aktiv lidlar byudjetlari yig'indisi) * 20% komissiya.
 */
export const BUDGET_ESTIMATES: Record<MonthlyBudget, number> = {
  "5mln_gacha": 3_000_000,
  "5_15mln": 10_000_000,
  "15_30mln": 22_500_000,
  "30mln_plus": 40_000_000,
};

export const COMMISSION_RATE = 0.2;

export const PROBLEMS = ["Obunachi", "Savdo", "Prosmotr"] as const;
export type Problem = (typeof PROBLEMS)[number];

export const PROBLEM_LABELS: Record<Problem, { title: string; hint: string }> = {
  Obunachi: { title: "Obunachi", hint: "Sahifaga obunachi kam qo'shilyapti" },
  Savdo: { title: "Savdo", hint: "Ko'rishlar bor, lekin sotuv yo'q" },
  Prosmotr: { title: "Prosmotr", hint: "Reels va postlar kam ko'rilyapti" },
};

export const STATUSES = ["yangi", "gaplashildi", "uchrashuv", "shartnoma", "rad_etildi"] as const;
export type LeadStatus = (typeof STATUSES)[number];

export const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  yangi: { label: "Yangi", color: "#C6FF00", bg: "rgba(198,255,0,0.12)" },
  gaplashildi: { label: "Gaplashildi", color: "#38BDF8", bg: "rgba(56,189,248,0.12)" },
  uchrashuv: { label: "Uchrashuv", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  shartnoma: { label: "Shartnoma", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  rad_etildi: { label: "Rad etildi", color: "#A1A1AA", bg: "rgba(161,161,170,0.12)" },
};

/** Voronka tartibi — "Statusni oldinga surish" shu ketma-ketlik bo'yicha ishlaydi */
export const PIPELINE: LeadStatus[] = ["yangi", "gaplashildi", "uchrashuv", "shartnoma"];

export function nextStatus(status: LeadStatus): LeadStatus | null {
  const i = PIPELINE.indexOf(status);
  if (i === -1 || i === PIPELINE.length - 1) return null;
  return PIPELINE[i + 1];
}

export const DEFAULT_SOURCE = "instagram_bio";
export const PHONE_REGEX = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;
