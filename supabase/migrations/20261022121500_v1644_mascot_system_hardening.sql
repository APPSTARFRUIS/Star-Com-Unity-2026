-- V1.6.44 — Ma Poire hardening
-- Separates personal equipment from admin universes and introduces explicit equipment slots.
alter table public.mascot_items
  add column if not exists equip_slot text,
  add column if not exists stackable boolean not null default false,
  add column if not exists layer_z integer not null default 10;

update public.mascot_items
set equip_slot = case category
  when 'background' then 'personal_background'
  when 'hat' then 'head'
  when 'glasses' then 'face'
  when 'clothing' then 'body'
  when 'shoes' then 'feet'
  when 'accessory' then 'accessory'
  when 'souvenir' then 'souvenir'
  else coalesce(category,'accessory')
end
where equip_slot is null or btrim(equip_slot)='';

-- Generic accessories are deliberately stackable. Visual slots remain exclusive by default.
update public.mascot_items set stackable=true where category='accessory';
update public.mascot_items set stackable=false where category in ('background','hat','glasses','clothing','shoes');

-- Deterministic rendering order.
update public.mascot_items set layer_z = case category
  when 'background' then 0
  when 'clothing' then 8
  when 'shoes' then 12
  when 'glasses' then 18
  when 'hat' then 20
  when 'accessory' then 25
  else coalesce(layer_z,10)
end;

-- One authoritative resolver for admin-imposed universes.
create or replace function public.get_active_mascot_experience()
returns setof public.mascot_experiences
language sql
stable
security invoker
set search_path = public
as $$
  select me.*
  from public.mascot_experiences me
  left join public.profiles p on p.id = auth.uid()
  where me.active = true
    and (me.starts_at is null or me.starts_at <= now())
    and (me.ends_at is null or me.ends_at >= now())
    and (
      coalesce(me.all_users,true)=true
      or p.company = any(coalesce(me.companies,'{}'::text[]))
    )
  order by me.created_at desc nulls last, me.id desc
  limit 1;
$$;
grant execute on function public.get_active_mascot_experience() to authenticated;
