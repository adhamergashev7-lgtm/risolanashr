import type { BusinessType, MonthlyBudget, Problem } from "./constants";

/**
 * Lid balli (0–100). Qoidalar:
 *  - Byudjet: 30mln+ → 40, 15–30mln → 30, 5–15mln → 20, 5mln gacha → 10
 *  - Muammo: Savdo → 30, Prosmotr → 15, Obunachi → 10 (bir nechtasi qo'shiladi)
 *  - Biznes turi Ishlab chiqarish yoki Klinika → 10
 *  - Izoh 20 belgidan uzun → 5
 *  Jami 100 dan oshmaydi.
 *
 * DIQQAT: xuddi shu mantiq bazada `public.calculate_lead_score()` funksiyasida ham bor
 * (supabase/migrations). Birini o'zgartirsangiz, ikkinchisini ham o'zgartiring.
 */
export const BUDGET_POINTS: Record<MonthlyBudget, number> = {
  "30mln_plus": 40,
  "15_30mln": 30,
  "5_15mln": 20,
  "5mln_gacha": 10,
};

export const PROBLEM_POINTS: Record<Problem, number> = {
  Savdo: 30,
  Prosmotr: 15,
  Obunachi: 10,
};

export const PRIORITY_BUSINESS: BusinessType[] = ["Ishlab chiqarish", "Klinika"];
export const MAX_SCORE = 100;

export interface ScoreInput {
  monthly_budget: MonthlyBudget | string | null | undefined;
  problems: readonly (Problem | string)[] | null | undefined;
  business_type: BusinessType | string | null | undefined;
  comment?: string | null;
}

export function calculateScore(input: ScoreInput): number {
  let score = 0;

  if (input.monthly_budget && input.monthly_budget in BUDGET_POINTS) {
    score += BUDGET_POINTS[input.monthly_budget as MonthlyBudget];
  }

  const problems = new Set(input.problems ?? []);
  for (const [problem, points] of Object.entries(PROBLEM_POINTS)) {
    if (problems.has(problem)) score += points;
  }

  if (input.business_type && PRIORITY_BUSINESS.includes(input.business_type as BusinessType)) {
    score += 10;
  }

  if ((input.comment ?? "").trim().length > 20) {
    score += 5;
  }

  return Math.max(0, Math.min(MAX_SCORE, score));
}

export type ScoreTier = "issiq" | "iliq" | "sovuq";

export const SCORE_LABELS: Record<ScoreTier, { label: string; color: string }> = {
  issiq: { label: "Issiq 🔥", color: "#EF4444" },
  iliq: { label: "Iliq", color: "#F59E0B" },
  sovuq: { label: "Sovuq", color: "#22C55E" },
};

export function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return "issiq";
  if (score >= 50) return "iliq";
  return "sovuq";
}

export function getScoreLabel(score: number) {
  return SCORE_LABELS[getScoreTier(score)];
}
