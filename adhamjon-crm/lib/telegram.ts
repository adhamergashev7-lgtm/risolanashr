import "server-only";
import { Telegram } from "telegraf";
import { sourceLabel } from "@/lib/constants";
import { siteUrl } from "@/lib/env";

interface LeadMessageData {
  full_name: string;
  phone: string;
  product: string | null;
  source: string;
  comment: string | null;
  stage?: string | null;
}

export function buildLeadMessage(lead: LeadMessageData, opts: { resend?: boolean } = {}) {
  const header = opts.resend ? "🔁 LID (qayta yuborildi)" : "🔥 YANGI LID!";
  return [
    header,
    "",
    `👤 Ism: ${lead.full_name}`,
    `📞 Tel: ${lead.phone}`,
    `🛍 Qiziqish: ${lead.product?.trim() || "—"}`,
    `📍 Manba: ${sourceLabel(lead.source)}`,
    ...(lead.stage ? [`📂 Yacheyka: ${lead.stage}`] : []),
    "",
    `💬 Izoh: ${lead.comment?.trim() || "—"}`,
    "",
    `👉 CRM da ko'rish: ${siteUrl()}/admin`,
  ].join("\n");
}

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID);
}

let telegram: Telegram | undefined;

/** Telegraf orqali admin chatga xabar. Forma kechikmasligi uchun 2.5 soniya timeout. */
export async function sendLeadToTelegram(lead: LeadMessageData, opts: { resend?: boolean } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false as const, error: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_CHAT_ID sozlanmagan" };
  }
  telegram ??= new Telegram(token);
  try {
    await Promise.race([
      telegram.sendMessage(chatId, buildLeadMessage(lead, opts), { link_preview_options: { is_disabled: true } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Telegram timeout (2.5s)")), 2500)),
    ]);
    return { ok: true as const };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Noma'lum xato";
    console.error("[telegram] xabar yuborilmadi:", error);
    return { ok: false as const, error };
  }
}
