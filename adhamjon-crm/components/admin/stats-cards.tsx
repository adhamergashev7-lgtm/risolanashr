"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, ShoppingBag, Users, Wallet } from "lucide-react";
import { endOfToday, formatMoney } from "@/lib/utils";
import type { Lead, Stage } from "@/types/lead";

const DAY = 864e5;

export function StatsCards({ leads, stages }: { leads: Lead[]; stages: Stage[] }) {
  // Vaqtga bog'liq hisoblar faqat brauzerda (hydration farqi bo'lmasligi uchun)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const s = useMemo(() => {
    const deletedId = stages.find((x) => x.key === "deleted")?.id;
    const boughtId = stages.find((x) => x.key === "bought")?.id;
    const callbackId = stages.find((x) => x.key === "callback")?.id;
    const active = leads.filter((l) => l.stage_id !== deletedId);
    const t = now ?? 0;
    const startToday = new Date(t).setHours(0, 0, 0, 0);
    const last30 = active.filter((l) => t - new Date(l.created_at).getTime() <= 30 * DAY);
    const today = active.filter((l) => new Date(l.created_at).getTime() >= startToday);
    const bought = active.filter((l) => l.stage_id === boughtId);
    const dueCalls = active.filter(
      (l) => (l.reminder_at && new Date(l.reminder_at).getTime() <= endOfToday()) || (l.stage_id === callbackId && !l.reminder_at),
    );
    const overdue = active.filter((l) => l.reminder_at && new Date(l.reminder_at).getTime() < t);
    const revenue = bought.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    return {
      total30: last30.length,
      today: today.length,
      bought: bought.length,
      conversion: active.length ? Math.round((bought.length / active.length) * 100) : 0,
      dueCalls: dueCalls.length,
      overdue: overdue.length,
      revenue,
    };
  }, [leads, stages, now]);

  const ready = now !== null;
  const cards = [
    { title: "Jami lidlar", value: s.total30, sub: `Oxirgi 30 kun · bugun +${s.today}`, icon: Users, brand: true },
    {
      title: "Qo'ng'iroq qilish",
      value: s.dueCalls,
      sub: s.overdue ? `${s.overdue} tasi muddati o'tgan` : "Bugungi eslatmalar",
      icon: BellRing,
      color: "#C2410C",
    },
    { title: "Sotib oldi", value: s.bought, sub: `Konversiya ${s.conversion}%`, icon: ShoppingBag, color: "#15803D" },
    { title: "Sotuv summasi", value: formatMoney(s.revenue), sub: "so'm · \"Sotib oldi\" lidlari", icon: Wallet, color: "#0E5A4D" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map(({ title, value, sub, icon: Icon, brand, color }) => (
        <div
          key={title}
          className={
            brand
              ? "qiymat-arcs relative overflow-hidden rounded-3xl bg-qiymat p-4 text-white sm:p-5"
              : "relative overflow-hidden rounded-3xl border border-border bg-white p-4 sm:p-5"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <p className={brand ? "text-xs font-semibold uppercase tracking-wider text-sage-60" : "text-xs font-semibold uppercase tracking-wider text-graphite-80"}>
              {title}
            </p>
            <span
              className={brand ? "rounded-full bg-white/10 p-1.5 text-white" : "rounded-full p-1.5"}
              style={brand ? undefined : { backgroundColor: `${color}14`, color }}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 truncate font-display text-3xl font-semibold tabular sm:text-4xl">{ready ? value : "—"}</p>
          <p className={brand ? "mt-1 text-[11px] text-sage-60 sm:text-xs" : "mt-1 text-[11px] text-graphite-80 sm:text-xs"}>{sub}</p>
        </div>
      ))}
    </div>
  );
}
