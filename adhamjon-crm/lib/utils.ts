import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** 07 noy 2026, 14:05 */
export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 07 noy */
export function formatShortDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** "5 daqiqa oldin" kabi nisbiy vaqt */
export function timeAgo(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} kun oldin`;
  return formatShortDate(d);
}

/** 12 500 000 -> "12,5 mln" */
export function formatMoney(sum: number) {
  if (sum >= 1_000_000_000) return `${(sum / 1_000_000_000).toFixed(1).replace(".", ",").replace(",0", "")} mlrd`;
  if (sum >= 1_000_000) return `${(sum / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} mln`;
  return new Intl.NumberFormat("ru-RU").format(sum);
}

/** "+998 90 123 45 67" -> "+998901234567" (tel: havola uchun) */
export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
