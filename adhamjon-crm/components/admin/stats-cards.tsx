"use client";

import { useMemo } from "react";
import { CalendarCheck, Flame, Users, Wallet } from "lucide-react";
import { BUDGET_ESTIMATES, COMMISSION_RATE } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import type { Lead } from "@/types/lead";

const DAY = 24 * 60 * 60 * 1000;

export function StatsCards({ leads }: { leads: Lead[] }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const last30 = leads.filter((l) => now - new Date(l.created_at).getTime() <= 30 * DAY);
    const prev30 = leads.filter((l) => {
      const age = now - new Date(l.created_at).getTime();
      return age > 30 * DAY && age <= 60 * DAY;
    });
    const hot = leads.filter((l) => l.score >= 80);
    const meetings = leads.filter((l) => l.status === "uchrashuv");
    const contracts = leads.filter((l) => l.status === "shartnoma").length;
    const active = leads.filter((l) => l.status !== "rad_etildi");
    const budgetSum = active.reduce((sum, l) => sum + (BUDGET_ESTIMATES[l.monthly_budget] ?? 0), 0);

    return {
      total30: last30.length,
      delta: last30.length - prev30.length,
      hot: hot.length,
      hotShare: leads.length ? Math.round((hot.length / leads.length) * 100) : 0,
      meetings: meetings.length,
      contracts,
      revenue: Math.round(budgetSum * COMMISSION_RATE),
    };
  }, [leads]);

  const cards = [
    {
      title: "Jami lidlar",
      value: stats.total30.toString(),
      sub: `Oxirgi 30 kun${stats.delta !== 0 ? ` · ${stats.delta > 0 ? "+" : ""}${stats.delta} oldingi oyga nisbatan` : ""}`,
      icon: Users,
      accent: true,
    },
    {
      title: "Issiq lidlar",
      value: stats.hot.toString(),
      sub: `Ball ≥ 80 · jami lidlarning ${stats.hotShare}%`,
      icon: Flame,
      color: "#EF4444",
    },
    {
      title: "Uchrashuvlar",
      value: stats.meetings.toString(),
      sub: `Belgilangan · ${stats.contracts} ta shartnoma`,
      icon: CalendarCheck,
      color: "#F59E0B",
    },
    {
      title: "Taxminiy daromad",
      value: formatMoney(stats.revenue),
      sub: "so'm · byudjetlar yig'indisi × 20%",
      icon: Wallet,
      color: "#22C55E",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map(({ title, value, sub, icon: Icon, accent, color }) => (
        <div
          key={title}
          className={
            accent
              ? "relative overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground sm:p-5"
              : "relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <p className={accent ? "text-xs font-bold uppercase tracking-wider opacity-70" : "text-xs font-bold uppercase tracking-wider text-muted-foreground"}>
              {title}
            </p>
            <span
              className={accent ? "rounded-lg bg-black/10 p-1.5" : "rounded-lg p-1.5"}
              style={accent ? undefined : { backgroundColor: `${color}1f`, color }}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 truncate font-display text-3xl font-extrabold tabular sm:text-4xl">{value}</p>
          <p className={accent ? "mt-1 text-[11px] font-medium opacity-70 sm:text-xs" : "mt-1 text-[11px] text-muted-foreground sm:text-xs"}>
            {sub}
          </p>
        </div>
      ))}
    </div>
  );
}
