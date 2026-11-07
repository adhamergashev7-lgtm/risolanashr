import { NextResponse } from "next/server";
import { DEFAULT_SOURCE } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { calculateScore } from "@/lib/score";
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

  // Honeypot to'ldirilgan bo'lsa — bot. Jim qabul qilamiz, lekin saqlamaymiz.
  if (website) return NextResponse.json({ ok: true });

  if (!isSupabaseConfigured()) {
    console.error("[api/leads] Supabase sozlanmagan: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return NextResponse.json({ ok: false, error: "Server sozlanmagan. Keyinroq urinib ko'ring." }, { status: 500 });
  }

  const id = crypto.randomUUID();
  // Score bazada ham trigger orqali qayta hisoblanadi — bu qiymat Telegram xabari uchun
  const score = calculateScore(values);

  const supabase = createSupabaseAnonClient();
  const { error } = await supabase.from("leads").insert({
    id,
    full_name: values.full_name,
    phone: values.phone,
    business_type: values.business_type,
    monthly_budget: values.monthly_budget,
    problems: values.problems,
    comment: values.comment,
    source: DEFAULT_SOURCE,
  });

  if (error) {
    console.error("[api/leads] insert xatosi:", error.message);
    return NextResponse.json({ ok: false, error: "Arizani saqlab bo'lmadi. Qayta urinib ko'ring." }, { status: 500 });
  }

  const telegram = await sendLeadToTelegram({ ...values, score });

  return NextResponse.json({ ok: true, id, score, telegram: telegram.ok }, { status: 201 });
}
