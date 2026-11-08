import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAnonClient } from "@/lib/supabase/server";
import { sendLeadToTelegram } from "@/lib/telegram";
import { flattenErrors, leadFormSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public forma: yangi lidni Supabase ga yozadi va Telegramga xabar yuboradi */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const parsed = leadFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Ma'lumotlarni tekshiring", fieldErrors: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { website, ...values } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // honeypot — bot

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, demo: true, error: "Demo rejim: Supabase sozlanmagan" }, { status: 503 });
  }

  const { error } = await createSupabaseAnonClient().from("leads").insert({
    id: crypto.randomUUID(),
    full_name: values.full_name,
    phone: values.phone,
    product: values.product,
    comment: values.comment,
    source: values.source,
  });

  if (error) {
    console.error("[api/leads] insert xatosi:", error.message);
    return NextResponse.json({ ok: false, error: "Arizani saqlab bo'lmadi. Qayta urinib ko'ring." }, { status: 500 });
  }

  const telegram = await sendLeadToTelegram(values);
  return NextResponse.json({ ok: true, telegram: telegram.ok }, { status: 201 });
}
