-- Namunaviy lidlar (ixtiyoriy). Yacheykalar migration ichida yaratiladi.
insert into public.leads (full_name, phone, product, source, comment, amount, stage_id, created_at)
select v.full_name, v.phone, v.product, v.source, v.comment, v.amount, s.id, now() - v.age
from (values
  ('Bilol - Dönerci Bilal', '+998 90 123 45 67', 'Muzlatgich Artel',        'instagram', null,                          null::numeric, 'new',        interval '2 hours'),
  ('Xiyobon Family Cafe',   '+998 93 765 43 21', 'Konditsioner 12-lik',     'telegram',  'Nasiyaga olmoqchi',           null,          'informed',   interval '1 day'),
  ('Kilo Family Outlet',    '+998 99 111 22 33', 'Kir yuvish mashinasi',    'instagram', 'Shanba kuni keladi',          null,          'invited',    interval '3 days'),
  ('Dr. Sardor - Klinika',  '+998 97 444 55 66', 'Televizor 55"',           'tavsiya',   null,                          7500000,       'bought',     interval '6 days'),
  ('Aziza Karimova',        '+998 94 222 10 20', 'Changyutgich',            'sayt',      'Kechqurun qo''ng''iroq qiling', null,        'callback',   interval '5 hours'),
  ('Jasur Toshmatov',       '+998 88 300 40 50', 'Smartfon',                'qongiroq',  null,                          null,          'no_answer',  interval '1 day'),
  ('Rustam Aliyev',         '+998 91 555 66 77', 'Gaz plita',               'dokon',     'MIB tekshiruvida qarz chiqdi', null,          'mib_debt',   interval '2 days')
) as v(full_name, phone, product, source, comment, amount, stage_key, age)
join public.stages s on s.key = v.stage_key;
