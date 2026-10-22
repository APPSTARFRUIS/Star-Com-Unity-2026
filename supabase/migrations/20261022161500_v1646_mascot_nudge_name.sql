-- V1.6.46 - Reliable personal mascot name for in-app nudges
create or replace function public.get_my_mascot_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(trim(m.name), '')
  from public.mascots m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

revoke all on function public.get_my_mascot_name() from public;
grant execute on function public.get_my_mascot_name() to authenticated;
