import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isTelegramConfigured, sendLeadToTelegram } from "@/lib/telegram";
import type { Lead } from "@/types/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: lidni Telegramga qayta yuborish */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Avval tizimga kiring" }, { status: 401 });

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Telegram sozlanmagan (TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID)" },
      { status: 500 },
    );
  }

  const { data: lead } = await supabase.from("leads").select("*").eq("id", params.id).maybeSingle<Lead>();
  if (!lead) return NextResponse.json({ ok: false, error: "Lid topilmadi" }, { status: 404 });

  const { data: stage } = await supabase.from("stages").select("name").eq("id", lead.stage_id).maybeSingle<{ name: string }>();

  const result = await sendLeadToTelegram({ ...lead, stage: stage?.name }, { resend: true });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });

  await supabase.from("lead_activities").insert({
    lead_id: lead.id,
    type: "telegram_sent",
    message: "Telegramga qayta yuborildi",
    author_email: user.email ?? null,
  });
  return NextResponse.json({ ok: true });
}
