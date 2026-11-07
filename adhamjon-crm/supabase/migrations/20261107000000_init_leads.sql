-- =====================================================================
-- Adhamjon CRM — Lidlar: boshlang'ich migration
-- =====================================================================

create extension if not exists "uuid-ossp" with schema extensions;

-- ---------- ENUM turlari ----------
do $$ begin
  create type public.business_type as enum ('Restoran', 'Do''kon', 'Klinika', 'Ishlab chiqarish', 'Xizmat', 'Boshqa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.monthly_budget as enum ('5mln_gacha', '5_15mln', '15_30mln', '30mln_plus');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum ('yangi', 'gaplashildi', 'uchrashuv', 'shartnoma', 'rad_etildi');
exception when duplicate_object then null; end $$;

-- ---------- leads jadvali ----------
create table if not exists public.leads (
  id              uuid primary key default extensions.uuid_generate_v4(),
  full_name       text not null check (char_length(trim(full_name)) between 2 and 120),
  phone           text not null check (phone ~ '^\+998 [0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}$'),
  business_type   public.business_type not null,
  monthly_budget  public.monthly_budget not null,
  problems        text[] not null default '{}'
                  check (problems <@ array['Obunachi', 'Savdo', 'Prosmotr']::text[]),
  comment         text check (comment is null or char_length(comment) <= 1000),
  score           integer not null default 0 check (score between 0 and 100),
  status          public.lead_status not null default 'yangi',
  source          text not null default 'instagram_bio',
  meeting_at      timestamptz,
  viewed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_score_idx on public.leads (score desc);

-- ---------- Lid tarixi (timeline) va menejer izohlari ----------
create table if not exists public.lead_activities (
  id            uuid primary key default extensions.uuid_generate_v4(),
  lead_id       uuid not null references public.leads (id) on delete cascade,
  type          text not null check (type in ('created', 'viewed', 'status_changed', 'note', 'call', 'meeting', 'telegram_sent')),
  message       text,
  meta          jsonb,
  author_email  text,
  created_at    timestamptz not null default now()
);

create index if not exists lead_activities_lead_idx on public.lead_activities (lead_id, created_at);

-- ---------- Score hisoblash (lib/score.ts bilan bir xil mantiq) ----------
create or replace function public.calculate_lead_score(
  p_budget   public.monthly_budget,
  p_problems text[],
  p_business public.business_type,
  p_comment  text
) returns integer
language sql
immutable
set search_path = ''
as $$
  select least(100,
      (case p_budget
         when '30mln_plus' then 40
         when '15_30mln'   then 30
         when '5_15mln'    then 20
         when '5mln_gacha' then 10
         else 0 end)
    + (case when 'Savdo'    = any(coalesce(p_problems, '{}')) then 30 else 0 end)
    + (case when 'Prosmotr' = any(coalesce(p_problems, '{}')) then 15 else 0 end)
    + (case when 'Obunachi' = any(coalesce(p_problems, '{}')) then 10 else 0 end)
    + (case when p_business in ('Ishlab chiqarish', 'Klinika') then 10 else 0 end)
    + (case when char_length(trim(coalesce(p_comment, ''))) > 20 then 5 else 0 end)
  );
$$;

-- BEFORE trigger: score har doim serverda hisoblanadi (formadan kelgan qiymatga ishonilmaydi)
create or replace function public.leads_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.score := public.calculate_lead_score(new.monthly_budget, new.problems, new.business_type, new.comment);
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists leads_before_write on public.leads;
create trigger leads_before_write
  before insert or update on public.leads
  for each row execute function public.leads_before_write();

-- AFTER trigger: timeline yozuvlari (Yaratildi / Ko'rildi / Status o'zgardi)
create or replace function public.leads_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
begin
  if tg_op = 'INSERT' then
    insert into public.lead_activities (lead_id, type, message, meta)
    values (new.id, 'created', 'Lid yaratildi', jsonb_build_object('source', new.source, 'score', new.score));
    return new;
  end if;

  if new.viewed_at is not null and old.viewed_at is null then
    insert into public.lead_activities (lead_id, type, message, author_email)
    values (new.id, 'viewed', 'Menejer ko''rdi', v_email);
  end if;

  if new.status is distinct from old.status then
    insert into public.lead_activities (lead_id, type, message, meta, author_email)
    values (new.id, 'status_changed', 'Status o''zgardi',
            jsonb_build_object('from', old.status, 'to', new.status), v_email);
  end if;

  return new;
end;
$$;

drop trigger if exists leads_log_activity on public.leads;
create trigger leads_log_activity
  after insert or update on public.leads
  for each row execute function public.leads_log_activity();

-- ---------- Row Level Security ----------
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

-- Public forma (anon): faqat yangi lid qo'sha oladi, o'qiy/o'zgartira olmaydi
drop policy if exists "anon_can_insert_leads" on public.leads;
create policy "anon_can_insert_leads" on public.leads
  for insert to anon
  with check (status = 'yangi' and viewed_at is null and meeting_at is null);

-- Admin / menejer (login qilgan foydalanuvchi): to'liq boshqaruv
drop policy if exists "authenticated_full_access_leads" on public.leads;
create policy "authenticated_full_access_leads" on public.leads
  for all to authenticated
  using (true) with check (true);

drop policy if exists "authenticated_full_access_activities" on public.lead_activities;
create policy "authenticated_full_access_activities" on public.lead_activities
  for all to authenticated
  using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.lead_activities to authenticated;

-- ---------- Realtime: yangi lid admin panelda darhol paydo bo'lsin ----------
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
