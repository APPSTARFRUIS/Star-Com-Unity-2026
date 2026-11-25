begin;
-- Historical records retained but no longer accessible via client roles.
revoke all on public.moods from anon, authenticated, public;
create schema if not exists pulse_private;
revoke all on schema pulse_private from public, anon, authenticated;
create table if not exists pulse_private.receipts (week date not null, voter uuid not null, primary key(week,voter));
create table if not exists pulse_private.totals (week date primary key, n integer not null default 0, positive integer not null default 0);
revoke all on all tables in schema pulse_private from public, anon, authenticated;
create or replace function public.pulse_has_answered() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from pulse_private.receipts where voter=auth.uid() and week=date_trunc('week',now() at time zone 'Europe/Paris')::date);
$$;
create or replace function public.pulse_submit(p_value integer) returns void language plpgsql security definer set search_path='' as $$
declare w date:=date_trunc('week',now() at time zone 'Europe/Paris')::date; u uuid:=auth.uid();
begin
 if u is null or p_value is null or p_value not between 1 and 4 then raise exception 'Invalid vote'; end if;
 insert into pulse_private.receipts values(w,u) on conflict do nothing;
 if not found then return; end if;
 insert into pulse_private.totals values(w,1,case when p_value>=3 then 1 else 0 end) on conflict(week) do update set n=pulse_private.totals.n+1,positive=pulse_private.totals.positive+excluded.positive;
end; $$;
create or replace function public.pulse_group_stats() returns table(week date,positive integer) language sql stable security definer set search_path='' as $$
 select t.week,case when t.n>=10 then (round(t.positive::numeric/t.n*10)*10)::integer else null end from pulse_private.totals t where auth.uid() is not null and t.week<date_trunc('week',now() at time zone 'Europe/Paris')::date order by t.week desc limit 8;
$$;
revoke all on function public.pulse_has_answered(),public.pulse_submit(integer),public.pulse_group_stats() from public,anon;
grant execute on function public.pulse_has_answered(),public.pulse_submit(integer),public.pulse_group_stats() to authenticated;
notify pgrst,'reload schema';
commit;
