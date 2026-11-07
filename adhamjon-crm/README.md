# Adhamjon CRM — Lidlar

Instagram bio'dagi Google Forms o'rniga ishlaydigan mini CRM: lidlarni qabul qiladi, avtomatik ball beradi,
Telegramga xabar yuboradi va menejerlar uchun boshqaruv paneli taqdim etadi.

**Texnologiyalar:** Next.js 14 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase (PostgreSQL + Auth + Realtime) · Telegraf · Vercel

| Sahifa | Kim uchun | Nima qiladi |
|---|---|---|
| `/` | Hamma (login shart emas) | Ariza formasi → Supabase ga yoziladi → Telegramga xabar → "Rahmat!" ekrani |
| `/login` | Admin / menejer | Email + parol bilan kirish |
| `/admin` | Faqat login qilganlar | Statistika, filtrlar, ro'yxat / Kanban, lid tafsiloti (drawer) |

---

## 1. O'rnatish

```bash
cd adhamjon-crm
npm install
cp .env.example .env.local   # keyin qiymatlarni to'ldiring
```

## 2. Supabase sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha oching.
2. **Project Settings → API** dan `Project URL` va `anon public` kalitni `.env.local` ga yozing:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. **Migration'ni ishga tushiring** — ikki usuldan biri:

   **A) SQL Editor orqali (eng oson):** Supabase → SQL Editor → `supabase/migrations/20261107000000_init_leads.sql`
   faylining butun matnini qo'yib **Run** bosing. Keyin namunaviy ma'lumotlar uchun `supabase/seed.sql` ni ham xuddi shunday ishga tushiring.

   **B) Supabase CLI orqali:**
   ```bash
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push                     # migration
   psql "<DATABASE_URL>" -f supabase/seed.sql   # seed (ixtiyoriy)
   ```
   Lokal Supabase (Docker) bilan: `npx supabase start` va `npx supabase db reset` — migration va seed avtomatik qo'llanadi.

4. **Admin foydalanuvchi yarating:** Authentication → Users → **Add user** → email + parol (Auto Confirm ✅).
5. **Ro'yxatdan o'tishni o'chiring** (faqat admin kirishi uchun): Authentication → Sign In / Providers → *Allow new users to sign up* ni o'chiring.

Migration nimalarni yaratadi:
- `leads` jadvali (enum'lar, telefon formati va muammolar uchun tekshiruvlar)
- `lead_activities` — timeline va menejer izohlari (Yaratildi → Ko'rildi → Status o'zgardi → Izoh ...)
- `calculate_lead_score()` funksiyasi va trigger — **ball har doim bazada qayta hisoblanadi**, formadan kelgan qiymatga ishonilmaydi
- RLS: anonim foydalanuvchi faqat yangi lid **qo'sha oladi** (o'qiy olmaydi); login qilganlar to'liq boshqaradi
- Realtime: yangi lid admin panelda sahifani yangilamasdan paydo bo'ladi

## 3. Telegram bot

1. Telegramda [@BotFather](https://t.me/BotFather) → `/newbot` → tokenni oling → `TELEGRAM_BOT_TOKEN`.
2. Botingizga istalgan xabar yozing (guruh bo'lsa — botni guruhga qo'shib, guruhda xabar yozing).
3. Brauzerda oching: `https://api.telegram.org/bot<TOKEN>/getUpdates` → `"chat":{"id": ...}` qiymatini `TELEGRAM_ADMIN_CHAT_ID` ga yozing
   (guruh ID'si minus bilan boshlanadi, masalan `-1001234567890`).

```
TELEGRAM_BOT_TOKEN=1234567890:AA...
TELEGRAM_ADMIN_CHAT_ID=123456789
NEXT_PUBLIC_SITE_URL=https://sizning-domeningiz.uz   # xabardagi "CRM da ko'rish" havolasi uchun
```

Xabar `/api/leads` ichida lid saqlangandan so'ng darhol yuboriladi (2.5 soniyalik timeout bilan — forma hech qachon osilib qolmaydi).
Admin panelda har bir lidni **"Telegramga qayta yuborish"** mumkin.

## 4. Ishga tushirish

```bash
npm run dev        # http://localhost:3000  (forma)  va  http://localhost:3000/admin
npm run build      # production build
npm start          # production server
npm test           # score va telefon maskasi testlari (vitest)
npm run lint       # ESLint
npm run typecheck  # TypeScript tekshiruvi
```

## 5. Vercel'ga deploy

1. Vercel → **Add New Project** → shu GitHub repozitoriyni tanlang.
2. **Root Directory:** `adhamjon-crm` (muhim — loyiha repozitoriy ichidagi papkada).
3. **Environment Variables:** `.env.example` dagi 5 ta o'zgaruvchini kiriting.
4. Deploy. Keyin Supabase → Authentication → URL Configuration → **Site URL** ga Vercel domeningizni yozing.
5. Instagram bio'ga `https://<domeningiz>/` havolasini qo'ying.

---

## Score (ball) qoidalari

| Shart | Ball |
|---|---|
| Byudjet 30 mln+ / 15–30 mln / 5–15 mln / 5 mln gacha | 40 / 30 / 20 / 10 |
| Muammo: Savdo / Prosmotr / Obunachi (har biri qo'shiladi) | 30 / 15 / 10 |
| Biznes turi: Ishlab chiqarish yoki Klinika | +10 |
| Izoh 20 belgidan uzun | +5 |
| **Maksimum** | **100** |

Belgilar: **80–100 Issiq 🔥** · **50–79 Iliq** · **0–49 Sovuq**.
Mantiq ikki joyda bir xil: `lib/score.ts` (Telegram xabari va testlar uchun) va SQL `calculate_lead_score()` (haqiqiy saqlanadigan qiymat).

Seed lidlar: Bilol — 60 (Iliq), Xiyobon — 45 (Sovuq), Kilo — 75 (Iliq), Dr. Sardor — 80 (Issiq 🔥).

**Taxminiy daromad** = rad etilmagan lidlar byudjetlarining o'rtacha qiymatlari yig'indisi × 20%
(5 mln gacha = 3 mln, 5–15 = 10 mln, 15–30 = 22,5 mln, 30+ = 40 mln — `lib/constants.ts` da o'zgartirish mumkin).

## Admin panel imkoniyatlari

- **Statistika:** jami lidlar (oxirgi 30 kun), issiq lidlar (ball ≥ 80), uchrashuvlar, taxminiy daromad
- **Filtrlar:** status tablari (soni bilan), biznes turi, ism/telefon bo'yicha qidiruv, saralash (yangi / ball)
- **Ro'yxat yoki Kanban** ko'rinishi (Kanban'da kartani sudrab boshqa ustunga tashlash mumkin)
- **Karta:** click-to-call telefon, biznes badge, byudjet, muammolar, rangli score bar, status pill (bosganda status o'zgaradi), sana
- **Amallar:** batafsil ko'rish, statusni oldinga surish, Telegramga qayta yuborish, o'chirish (tasdiqlash bilan)
- **Drawer:** barcha ma'lumotlar, timeline (vaqt bilan), menejer izohi, "Qo'ng'iroq qilish" va "Uchrashuv belgilash" tugmalari
- Lid birinchi marta ochilganda avtomatik **"Ko'rildi"** deb belgilanadi (ko'rilmagan lidlar yashil nuqta bilan)

## Loyiha tuzilmasi

```
adhamjon-crm/
├── app/
│   ├── page.tsx                      # Public forma (/)
│   ├── login/page.tsx                # Kirish
│   ├── admin/page.tsx                # CRM dashboard
│   └── api/leads/
│       ├── route.ts                  # POST: lid saqlash + Telegram
│       └── [id]/telegram/route.ts    # POST: Telegramga qayta yuborish (faqat admin)
├── components/
│   ├── ui/                           # shadcn/ui komponentlari
│   ├── form/lead-form.tsx            # Forma (validatsiya + telefon maskasi)
│   └── admin/                        # Dashboard, statistika, filtr, karta, kanban, drawer
├── lib/
│   ├── score.ts                      # Ball hisoblash
│   ├── telegram.ts                   # Telegraf orqali xabar
│   ├── validation.ts                 # Zod sxemasi (klient + server)
│   ├── phone.ts                      # +998 XX XXX XX XX maskasi
│   ├── constants.ts                  # Enum'lar, label'lar, ranglar
│   └── supabase/                     # Browser / server / middleware client'lar
├── middleware.ts                     # /admin ni login bilan himoyalash
└── supabase/
    ├── migrations/20261107000000_init_leads.sql
    ├── seed.sql
    └── config.toml
```

## Xavfsizlik eslatmalari

- Forma `anon` kalit bilan ishlaydi; RLS tufayli anonim foydalanuvchi hech qanday lidni **o'qiy olmaydi**, faqat `status = 'yangi'` bilan qo'sha oladi.
- Botlardan himoya uchun formada yashirin honeypot maydoni bor.
- Ball va `updated_at` bazadagi trigger orqali yoziladi — ularni tashqaridan soxtalashtirib bo'lmaydi.
