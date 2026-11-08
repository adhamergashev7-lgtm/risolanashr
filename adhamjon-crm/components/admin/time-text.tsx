"use client";

import { useEffect, useState } from "react";
import { cn, endOfToday, formatDateTime, formatShortDateTime, timeAgo } from "@/lib/utils";

/** Mijoz tomonda "hozir" — server/mijoz vaqt farqi tufayli hydration xatosi bo'lmasligi uchun */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Sana/vaqtni faqat brauzerda formatlaydi (server UTC va mijoz vaqt zonasi farqli) */
export function TimeText({
  value,
  format = "datetime",
  className,
}: {
  value: string | null | undefined;
  format?: "datetime" | "short" | "ago";
  className?: string;
}) {
  const now = useNow();
  let text = " ";
  if (now !== null) {
    if (!value) text = "—";
    else text = format === "ago" ? timeAgo(value) : format === "short" ? formatShortDateTime(value) : formatDateTime(value);
  }
  return (
    <time dateTime={value ?? undefined} className={className}>
      {text}
    </time>
  );
}

/** Eslatma vaqti: o'tib ketgan — qizil, bugun — to'q sariq, keyin — yashil */
export function ReminderBadge({ value, icon, className }: { value: string; icon?: React.ReactNode; className?: string }) {
  const now = useNow();
  if (now === null) return <span className={cn("h-6", className)} />;
  const t = new Date(value).getTime();
  const state = t < now ? "overdue" : t <= endOfToday() ? "today" : "later";
  const styles = {
    overdue: "bg-red-50 text-danger",
    today: "bg-orange-50 text-warning",
    later: "bg-sage-40 text-qiymat",
  }[state];
  const label = { overdue: "Muddati o'tdi", today: "Bugun", later: "Eslatma" }[state];
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", styles, className)}>
      {icon}
      {label}: {formatShortDateTime(value)}
    </span>
  );
}
