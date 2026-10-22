-- V1.6.45 — authoritative mascot admin-universe resolver
-- The previous SECURITY INVOKER resolver could be blocked by RLS on profiles/experiences.
-- This function resolves only the current authenticated user's applicable universe.
create or replace function public.get_active_mascot_experience()
returns setof public.mascot_experiences
language sql
stable
security definer
set search_path = public
as $$
  select me.*
  from public.mascot_experiences me
  where auth.uid() is not null
    and me.active = true
    and (me.starts_at is null or me.starts_at <= now())
    and (me.ends_at is null or me.ends_at >= now())
    and (
      coalesce(me.all_users, true) = true
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.company = any(coalesce(me.companies, '{}'::text[]))
      )
    )
  order by me.created_at desc nulls last, me.id desc
  limit 1;
$$;

revoke all on function public.get_active_mascot_experience() from public, anon;
grant execute on function public.get_active_mascot_experience() to authenticated;
