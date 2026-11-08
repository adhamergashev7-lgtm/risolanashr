-- =====================================================================
-- Qiymat CRM — umumiy lidlar CRM: boshlang'ich migration
-- =====================================================================

create extension if not exists "uuid-ossp" with schema extensions;

-- ---------- Yacheykalar (bosqichlar) ----------
create table if not exists public.stages (
  id          uuid primary key default extensions.uuid_generate_v4(),
  name        text not null check (char_length(trim(name)) between 1 and 60),
  color       text not null default '#0E5A4D' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position    integer not null default 0,
  key         text unique,                        -- tizim yacheykalari: new, callback, ..., deleted
  is_default  boolean not null default false,     -- yangi lid shu yacheykaga tushadi
  created_at  timestamptz not null default now()
);

create unique index if not exists stages_one_default on public.stages (is_default) where is_default;

insert into public.stages (key, name, color, position, is_default) values
  ('new',        'Yangi lidlar',         '#0E5A4D', 0, true),
  ('callback',   'Qayta qo''ng''iroq',   '#C2410C', 1, false),
  ('informed',   'Ma''lumot berildi',    '#1D4ED8', 2, false),
  ('invited',    'Do''konga chaqirildi', '#0E7490', 3, false),
  ('bought',     'Sotib oldi',           '#15803D', 4, false),
  ('not_bought', 'Sotib olmadi',         '#B91C1C', 5, false),
  ('mib_debt',   'MIBdan qarzi bor',     '#A16207', 6, false),
  ('no_answer',  'Ko''tarmadi',          '#64748B', 7, false),
  ('deleted',    'O''chirilgan',         '#4E5759', 8, false)
on conflict (key) do nothing;

-- Tizim yacheykalarini o'chirish taqiqlanadi (nomi/rangi o'zgartirilishi mumkin)
create or replace function public.stages_protect_system()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.key is not null then
    raise exception 'Tizim yacheykasini o''chirib bo''lmaydi: %', old.name;
  end if;
  return old;
end; $$;

drop trigger if exists stages_protect_system on public.stages;
create trigger stages_protect_system before delete on public.stages
  for each row execute function public.stages_protect_system();

create or replace function public.default_stage_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.stages order by is_default desc, position asc limit 1;
$$;

-- ---------- Lidlar ----------
create table if not exists public.leads (
  id           uuid primary key default extensions.uuid_generate_v4(),
  full_name    text not null check (char_length(trim(full_name)) between 2 and 120),
  phone        text not null check (phone ~ '^\+998 [0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}$'),
  product      text check (product is null or char_length(product) <= 200),
  source       text not null default 'sayt',
  comment      text check (comment is null or char_length(comment) <= 1000),
  amount       numeric(14, 0) check (amount is null or amount >= 0),
  stage_id     uuid references public.stages (id) on delete restrict,
  reminder_at  timestamptz,
  viewed_at    timestamptz,
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_stage_idx on public.leads (stage_id);
create index if not exists leads_reminder_idx on public.leads (reminder_at) where reminder_at is not null;

-- ---------- Tarix (timeline) va menejer izohlari ----------
create table if not exists public.lead_activities (
  id            uuid primary key default extensions.uuid_generate_v4(),
  lead_id       uuid not null references public.leads (id) on delete cascade,
  type          text not null check (type in ('created', 'viewed', 'stage_changed', 'note', 'call', 'reminder', 'telegram_sent', 'edited')),
  message       text,
  meta          jsonb,
  author_email  text,
  created_at    timestamptz not null default now()
);

create index if not exists lead_activities_lead_idx on public.lead_activities (lead_id, created_at);

-- ---------- Triggerlar ----------
create or replace function public.leads_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    -- Public forma (anon) faqat asosiy maydonlarni yubora oladi
    if current_user = 'anon' then
      new.stage_id := null;
      new.amount := null;
      new.reminder_at := null;
      new.viewed_at := null;
      new.created_by := null;
      new.created_at := now();
    end if;
    if new.stage_id is null then
      new.stage_id := public.default_stage_id();
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end; $$;

drop trigger if exists leads_before_write on public.leads;
create trigger leads_before_write before insert or update on public.leads
  for each row execute function public.leads_before_write();

create or replace function public.leads_log_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_email text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
  v_from text;
  v_to text;
begin
  if tg_op = 'INSERT' then
    insert into public.lead_activities (lead_id, type, message, meta, author_email)
    values (new.id, 'created', 'Lid yaratildi', jsonb_build_object('source', new.source), coalesce(new.created_by, v_email));
    return new;
  end if;

  if new.viewed_at is not null and old.viewed_at is null then
    insert into public.lead_activities (lead_id, type, message, author_email)
    values (new.id, 'viewed', 'Menejer ko''rdi', v_email);
  end if;

  if new.stage_id is distinct from old.stage_id then
    select name into v_from from public.stages where id = old.stage_id;
    select name into v_to from public.stages where id = new.stage_id;
    insert into public.lead_activities (lead_id, type, message, meta, author_email)
    values (new.id, 'stage_changed', 'Yacheyka o''zgardi',
            jsonb_build_object('from', v_from, 'to', v_to, 'to_id', new.stage_id), v_email);
  end if;

  return new;
end; $$;

drop trigger if exists leads_log_activity on public.leads;
create trigger leads_log_activity after insert or update on public.leads
  for each row execute function public.leads_log_activity();

-- ---------- Row Level Security ----------
alter table public.stages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

-- Public forma: faqat qo'shish (o'qish/o'zgartirish yo'q). Maydonlarni trigger cheklaydi.
drop policy if exists "anon_can_insert_leads" on public.leads;
create policy "anon_can_insert_leads" on public.leads for insert to anon with check (true);

-- Login qilgan menejerlar: to'liq boshqaruv
drop policy if exists "auth_all_leads" on public.leads;
create policy "auth_all_leads" on public.leads for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_stages" on public.stages;
create policy "auth_all_stages" on public.stages for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_activities" on public.lead_activities;
create policy "auth_all_activities" on public.lead_activities for all to authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads, public.stages, public.lead_activities to authenticated;

-- ---------- Realtime: o'zgarishlar boshqa menejerlarda darhol ko'rinadi ----------
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.stages;
exception when duplicate_object then null; when undefined_object then null; end $$;
