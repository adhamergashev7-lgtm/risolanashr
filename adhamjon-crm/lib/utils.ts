import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
const pad = (n: number) => n.toString().padStart(2, "0");

/** 07 noy 2026, 14:05 */
export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 07 noy, 14:05 */
export function formatShortDateTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "5 daqiqa oldin" */
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
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** 12 500 000 -> "12,5 mln" */
export function formatMoney(sum: number) {
  if (sum >= 1_000_000_000) return `${(sum / 1_000_000_000).toFixed(1).replace(".", ",").replace(",0", "")} mlrd`;
  if (sum >= 1_000_000) return `${(sum / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} mln`;
  return new Intl.NumberFormat("ru-RU").format(sum);
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Date -> datetime-local input qiymati (mahalliy vaqt) */
export function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Hex rangdan shaffof fon */
export function tint(hex: string, alpha = 0.1) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
