import { describe, expect, it } from "vitest";
import { calculateScore, getScoreLabel, getScoreTier } from "./score";

describe("calculateScore", () => {
  it("seed lidlari uchun to'g'ri ball beradi", () => {
    expect(calculateScore({ monthly_budget: "15_30mln", problems: ["Savdo"], business_type: "Restoran" })).toBe(60);
    expect(
      calculateScore({ monthly_budget: "5_15mln", problems: ["Prosmotr", "Obunachi"], business_type: "Restoran" }),
    ).toBe(45);
    expect(calculateScore({ monthly_budget: "15_30mln", problems: ["Savdo", "Prosmotr"], business_type: "Do'kon" })).toBe(
      75,
    );
    expect(calculateScore({ monthly_budget: "30mln_plus", problems: ["Savdo"], business_type: "Klinika" })).toBe(80);
  });

  it("byudjet ballari", () => {
    expect(calculateScore({ monthly_budget: "5mln_gacha", problems: [], business_type: "Boshqa" })).toBe(10);
    expect(calculateScore({ monthly_budget: "30mln_plus", problems: [], business_type: "Boshqa" })).toBe(40);
  });

  it("izoh 20 belgidan uzun bo'lsa +5", () => {
    const base = { monthly_budget: "5mln_gacha", problems: [], business_type: "Xizmat" } as const;
    expect(calculateScore({ ...base, comment: "12345678901234567890" })).toBe(10);
    expect(calculateScore({ ...base, comment: "123456789012345678901" })).toBe(15);
    expect(calculateScore({ ...base, comment: "   qisqa   " })).toBe(10);
  });

  it("100 dan oshmaydi", () => {
    expect(
      calculateScore({
        monthly_budget: "30mln_plus",
        problems: ["Savdo", "Prosmotr", "Obunachi"],
        business_type: "Ishlab chiqarish",
        comment: "Biz yirik ishlab chiqarish korxonasimiz, savdoni oshirmoqchimiz",
      }),
    ).toBe(100);
  });
});

describe("score label", () => {
  it("chegaralar", () => {
    expect(getScoreTier(80)).toBe("issiq");
    expect(getScoreTier(79)).toBe("iliq");
    expect(getScoreTier(50)).toBe("iliq");
    expect(getScoreTier(49)).toBe("sovuq");
    expect(getScoreLabel(100).label).toBe("Issiq 🔥");
  });
});
