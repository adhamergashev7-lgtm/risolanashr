-- Seed data: 4 ta namunaviy lid. Score trigger orqali avtomatik hisoblanadi:
--   Bilol (60, Iliq), Xiyobon (45, Sovuq), Kilo (75, Iliq), Dr. Sardor (80, Issiq 🔥)

insert into public.leads (full_name, phone, business_type, monthly_budget, problems, status, created_at)
values
  ('Bilol - Dönerci Bilal', '+998 90 123 45 67', 'Restoran', '15_30mln', array['Savdo'],               'yangi',       now() - interval '2 hours'),
  ('Xiyobon Family Cafe',   '+998 93 765 43 21', 'Restoran', '5_15mln',  array['Prosmotr', 'Obunachi'], 'gaplashildi', now() - interval '1 day'),
  ('Kilo Family Outlet',    '+998 99 111 22 33', 'Do''kon',  '15_30mln', array['Savdo', 'Prosmotr'],    'uchrashuv',   now() - interval '3 days'),
  ('Dr. Sardor - Klinika',  '+998 97 444 55 66', 'Klinika',  '30mln_plus', array['Savdo'],             'shartnoma',   now() - interval '6 days');
