-- V1.6.42 FINAL — resolve exactly one active mascot universe for current user.
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
      coalesce(me.all_users, true) = true
      or coalesce(me.companies, '{}'::text[]) @> array[p.company]::text[]
    )
  order by me.created_at desc, me.id desc
  limit 1;
$$;
grant execute on function public.get_active_mascot_experience() to authenticated;
