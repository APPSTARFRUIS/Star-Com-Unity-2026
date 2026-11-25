begin;
create or replace function public.collective_learning_challenges()
returns table(path text, percent integer, target integer)
language sql stable security definer set search_path = '' as $$
 with eligible as (select p.id from public.profiles p where p.is_active is true),
 levels as (select g.id, lower(trim(g.learning_path)) as k, trim(g.learning_path) as label from public.games g where g.status in ('Actif','Terminé') and g.type <> 'Pari' and nullif(trim(g.learning_path),'') is not null),
 paths as (select k,min(label) as label from levels group by k),
 totals as (select count(*) as n from eligible)
 select p.label, round(100.0 * (select count(*) from eligible e where not exists (select 1 from levels l where l.k=p.k and not exists (select 1 from public.game_completions c where c.user_id=e.id and c.game_id=l.id and c.passed is true))) / nullif(t.n,0))::integer, 80
 from paths p cross join totals t
 where t.n >= 10 and exists(select 1 from eligible e where e.id=auth.uid())
 order by p.label;
$$;
revoke all on function public.collective_learning_challenges() from public, anon;
grant execute on function public.collective_learning_challenges() to authenticated;
notify pgrst, 'reload schema';
commit;
