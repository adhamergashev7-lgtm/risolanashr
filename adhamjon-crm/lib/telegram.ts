import "server-only";
import { Telegram } from "telegraf";
import { BUDGET_LABELS } from "@/lib/constants";
import { siteUrl } from "@/lib/env";
import { getScoreLabel } from "@/lib/score";
import type { Lead } from "@/types/lead";

type LeadMessageData = Pick<
  Lead,
  "full_name" | "phone" | "business_type" | "monthly_budget" | "problems" | "comment" | "score"
>;

export function buildLeadMessage(lead: LeadMessageData, opts: { resend?: boolean } = {}) {
  const header = opts.resend ? "🔁 LID (qayta yuborildi)" : "🔥 YANGI LID!";
  const problems = lead.problems?.length ? lead.problems.join(", ") : "—";
  const comment = lead.comment?.trim() ? lead.comment.trim() : "—";

  return [
    header,
    "",
    `👤 Ism: ${lead.full_name}`,
    `📞 Tel: ${lead.phone}`,
    `🏢 Biznes: ${lead.business_type}`,
    `💰 Byudjet: ${BUDGET_LABELS[lead.monthly_budget] ?? lead.monthly_budget}`,
    `❗ Muammo: ${problems}`,
    `⭐ Ball: ${lead.score} / 100 (${getScoreLabel(lead.score).label})`,
    "",
    `💬 Izoh: ${comment}`,
    "",
    `👉 CRM da ko'rish: ${siteUrl()}/admin`,
  ].join("\n");
}

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID);
}

let telegram: Telegram | undefined;

/**
 * Telegraf orqali admin chatga xabar yuboradi.
 * Forma javobi kechikmasligi uchun 2.5 soniyalik timeout bor (talab: 3 soniya ichida).
 */
export async function sendLeadToTelegram(lead: LeadMessageData, opts: { resend?: boolean } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    return { ok: false as const, error: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_CHAT_ID sozlanmagan" };
  }

  telegram ??= new Telegram(token);

  try {
    await Promise.race([
      telegram.sendMessage(chatId, buildLeadMessage(lead, opts), {
        link_preview_options: { is_disabled: true },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Telegram timeout (2.5s)")), 2500)),
    ]);
    return { ok: true as const };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Noma'lum xato";
    console.error("[telegram] xabar yuborilmadi:", error);
    return { ok: false as const, error };
  }
}
