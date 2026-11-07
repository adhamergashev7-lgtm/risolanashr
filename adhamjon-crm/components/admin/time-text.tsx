"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatShortDate, timeAgo } from "@/lib/utils";

/**
 * Sana/vaqtni faqat brauzerda formatlaydi — server (UTC) va mijoz (Toshkent) vaqt zonasi
 * farqi tufayli hydration xatosi chiqmasligi uchun.
 */
export function TimeText({
  value,
  format = "datetime",
  className,
}: {
  value: string | null | undefined;
  format?: "datetime" | "short" | "ago";
  className?: string;
}) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setText("—");
      return;
    }
    const render = () =>
      setText(format === "ago" ? timeAgo(value) : format === "short" ? formatShortDate(value) : formatDateTime(value));
    render();
    if (format !== "ago") return;
    const t = setInterval(render, 60_000);
    return () => clearInterval(t);
  }, [value, format]);

  return (
    <time dateTime={value ?? undefined} className={className}>
      {text || " "}
    </time>
  );
}
