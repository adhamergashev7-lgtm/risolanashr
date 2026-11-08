# Qiymat CRM — Lidlar

Har qanday biznes uchun umumiy CRM: ariza formasi orqali lidlarni qabul qiladi, menejerlar ularni **yacheykalar**
(bosqichlar) bo'yicha boshqaradi. Dizayn — Qiymat agency brendbuki (2026).

**Texnologiyalar:** Next.js 14 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase (PostgreSQL + Auth + Realtime) · Telegraf · Vercel

| Sahifa | Kim uchun | Nima qiladi |
|---|---|---|
| `/` | Hamma | Ariza formasi (ism, telefon, qiziqish, izoh) → CRM ga tushadi → Telegramga xabar |
| `/login` | Admin / menejer | Email + parol bilan kirish (demo rejimda kerak emas) |
| `/admin` | Menejerlar | Yacheykalar (Kanban), ro'yxat, statistika, lid tafsiloti |

## Yacheykalar

Standart yacheykalar (migration yaratadi):

**Yangi lidlar** → **Qayta qo'ng'iroq** → **Ma'lumot berildi** → **Do'konga chaqirildi** → **Sotib oldi** /
**Sotib olmadi** / **MIBdan qarzi bor** / **Ko'tarmadi** · **O'chirilgan**

- **"+ Yacheyka"** tugmasi (yoki ustunlar oxiridagi katta "Yacheyka qo'shish" bloki) — o'zingizning bosqichingizni qo'shasiz: nom + rang.
- Har bir ustun menyusi (⋯): lid qo'shish, nomi/rangini o'zgartirish, chapga/o'ngga surish, o'chirish.
- Standart yacheykalar nomini va rangini o'zgartirish mumkin, lekin o'chirib bo'lmaydi (statistika ularga tayanadi).
  Qo'shimcha yacheykani o'chirganda undagi lidlar siz tanlagan yacheykaga ko'chiriladi.
- "Yangi lidlar" — formadan kelgan arizalar tushadigan joy.
- **O'chirish** lidni "O'chirilgan" yacheykasiga o'tkazadi (qayta tiklash mumkin). U yerdan **Butunlay o'chirish** mumkin.

## Imkoniyatlar

- **"+ Yangi lid"** — qo'ng'iroq, do'kon, Telegram va boshqa manbalardan kelgan mijozni qo'lda qo'shish
  (ism, telefon, qiziqish, manba, yacheyka, summa, eslatma vaqti, izoh)
- **Kanban:** lidni sudrab boshqa yacheykaga tashlash yoki karta pastidagi rangli pill orqali ko'chirish
- **Eslatma (qayta qo'ng'iroq):** vaqt qo'yiladi. Muddati o'tganlar qizil, bugungilar to'q sariq rangda ko'rinadi
- **Statistika:** jami lidlar (30 kun), bugun qo'ng'iroq qilinadiganlar, sotib olganlar va konversiya, sotuv summasi
- **Qidiruv** (ism, telefon, mahsulot), manba bo'yicha filtr, saralash (yangi / eslatma / ism)
- **Lid tafsiloti:**
  - "Qo'ng'iroq qilish" (`tel:` havola)
  - yacheykalar orasida tez ko'chirish
  - menejer izohlari
  - tarix: yaratildi → ko'rildi → yacheyka o'zgardi → izoh → eslatma
- **Realtime:** bir menejer o'zgartirsa, boshqalarda darhol ko'rinadi (Supabase rejimida)
- Forma manbasini havola orqali belgilash: `https://domen/?manba=instagram` (`telegram`, `sayt`, `tavsiya` ...)

## Demo rejim va haqiqiy baza

Supabase kalitlari **berilmasa**, ilova **demo rejimda** ishlaydi:
- login so'ralmaydi;
- ma'lumotlar faqat shu brauzerda (localStorage) saqlanadi;
- namunaviy lidlar avtomatik qo'shiladi;
- formadan yuborilgan ariza shu brauzerdagi CRM ga tushadi.

Bu dizayn va funksiyalarni sinab ko'rish uchun mo'ljallangan.

Jamoa bilan **umumiy baza** uchun Supabase ulang (quyida). Kalitlar qo'shilishi bilan ilova avtomatik haqiqiy rejimga o'tadi.

---

## 1. O'rnatish

```bash
cd adhamjon-crm
npm install
cp .env.example .env.local   # Supabase kalitlarini yozing (yoki bo'sh qoldiring — demo rejim)
npm run dev                  # http://localhost:3000  va  http://localhost:3000/admin
```

## 2. Supabase ulash

1. [supabase.com](https://supabase.com) da yangi loyiha oching.
2. **SQL Editor** → `supabase/migrations/20261108000000_init_crm.sql` matnini qo'yib **Run** bosing.
   Namunaviy lidlar kerak bo'lsa, keyin `supabase/seed.sql` ni ham ishga tushiring.
   (CLI bilan: `npx supabase link --project-ref <REF>` → `npx supabase db push`.)
3. **Authentication → Users → Add user** — har bir menejer uchun email + parol (Auto Confirm ✅).
4. **Authentication → Sign In / Providers** — *Allow new users to sign up* ni o'chiring (begonalar ro'yxatdan o'ta olmasin).
5. **Project Settings → API** dan `Project URL` va `anon public` kalitni oling:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

Xavfsizlik (RLS):
- forma (anonim) faqat yangi lid **qo'sha oladi**, o'qiy olmaydi;
- formadan kelgan lid har doim "Yangi lidlar"ga tushadi — buni bazadagi trigger ta'minlaydi;
- login qilgan menejerlar hamma narsani boshqaradi.

## 3. Telegram (ixtiyoriy)

1. [@BotFather](https://t.me/BotFather) → `/newbot` → `TELEGRAM_BOT_TOKEN`.
2. Botga (yoki bot qo'shilgan guruhga) xabar yozing.
3. `https://api.telegram.org/bot<TOKEN>/getUpdates` ochib, `chat.id` ni oling → `TELEGRAM_ADMIN_CHAT_ID`.

Har bir yangi ariza Telegramga darhol yuboriladi. Telegram javob bermasa, forma 2.5 soniyadan ko'p kutmaydi.
Admin panelda "Telegramga yuborish" orqali lidni qayta yuborish mumkin.

## 4. Vercel

Loyiha repozitoriy ichidagi `adhamjon-crm/` papkasida joylashgan, shuning uchun Vercel'da **Root Directory = `adhamjon-crm`**.

Vercel → Project → **Settings → Environment Variables** ga `.env.example` dagi o'zgaruvchilarni qo'shing va **Redeploy** qiling.
Supabase'da **Authentication → URL Configuration → Site URL** ga Vercel domenini yozing.

## Buyruqlar

```bash
npm run dev        # ishlab chiqish
npm run build      # production build
npm test           # telefon maskasi va validatsiya testlari
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Tuzilma

```
adhamjon-crm/
├── app/
│   ├── page.tsx                 # Ariza formasi (/)
│   ├── login/page.tsx           # Kirish
│   ├── admin/page.tsx           # CRM
│   └── api/leads/…              # Forma API + Telegramga qayta yuborish
├── components/
│   ├── admin/                   # Dashboard, Kanban, karta, drawer, dialoglar, statistika
│   ├── form/                    # Public forma, telefon maskasi
│   └── ui/                      # shadcn/ui
├── lib/
│   ├── store/                   # Ma'lumotlar qatlami: Supabase yoki demo (localStorage)
│   ├── constants.ts             # Standart yacheykalar, manbalar, ranglar
│   ├── validation.ts · phone.ts · telegram.ts · brand.ts
│   └── supabase/                # Supabase client'lar
├── public/                      # Qiymat logotipi va emblemasi
└── supabase/
    ├── migrations/20261108000000_init_crm.sql
    └── seed.sql
```

## Brend

Ranglar Qiymat agency brendbukidan olingan:

| Rang | Hex |
|---|---|
| qiymat-green | `#0E5A4D` |
| graphite | `#222D2F` |
| sage | `#92B79C` |
| deep-green | `#23463F` |
| white | `#FFFFFF` |

Sarlavhalar uchun YD Yoonche o'rniga unga yaqin geometrik **Outfit** shrifti ishlatilgan, matn uchun — **Inter**.
Logotip va emblema brendbukdagi vektor fayllar.
