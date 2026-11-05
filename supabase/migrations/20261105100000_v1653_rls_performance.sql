-- Star Com'Unity V1.6.53 — Performance des règles de sécurité (RLS)
--
-- PROBLÈME : les règles RLS appellent auth.uid(), is_content_moderator(),
-- is_current_user_admin() et can_view_company_audience(...) SANS les encapsuler
-- dans un "select". Postgres les réévalue alors POUR CHAQUE LIGNE lue, et chacune
-- de ces fonctions relit la table profiles. Lire 400 commentaires = 400 à 1 200
-- requêtes cachées. C'est l'alerte « auth_rls_initplan » du Performance Advisor Supabase.
--
-- CORRECTIF : chaque appel est réécrit en "(select ...)" : calculé UNE fois par requête.
-- Les droits d'accès restent strictement identiques (même logique, mêmes rôles).
--
-- Sûr à relancer. Une sauvegarde des règles d'origine est faite dans
-- public._policy_backup_v1653 (voir le script de retour arrière en bas de fichier).

begin;

-- 1) Fonction utilitaire : société de l'utilisateur connecté (normalisée).
create or replace function public.current_user_company_norm()
returns text
language sql stable security definer set search_path = public
as $$
  select lower(trim(coalesce(p.company, ''))) from public.profiles p where p.id = auth.uid();
$$;
revoke all on function public.current_user_company_norm() from public;
grant execute on function public.current_user_company_norm() to authenticated;

-- 2) Sauvegarde des règles actuelles (une seule fois).
create table if not exists public._policy_backup_v1653 as
  select schemaname, tablename, policyname, qual, with_check, now() as saved_at
  from pg_policies where schemaname = 'public';
alter table public._policy_backup_v1653 enable row level security; -- non lisible par l'appli

-- 3) Réécriture des règles.
create or replace function pg_temp.v1653_optimize(expr text)
returns text language plpgsql immutable as $$
declare r text := expr;
begin
  if r is null then return null; end if;

  -- can_view_company_audience(col) -> même logique, en ligne, avec valeurs mises en cache
  r := regexp_replace(
    r,
    '(?<![a-z0-9_.])(?:public\.)?can_view_company_audience\(([a-z_]+)\)',
    '(( SELECT public.is_current_user_admin()) OR (''ALL''::text = ANY (COALESCE(\1, ARRAY[]::text[]))) OR (( SELECT public.current_user_company_norm()) = ANY (ARRAY( SELECT lower(TRIM(BOTH FROM x.c)) FROM unnest(COALESCE(\1, ARRAY[]::text[])) x(c)))))',
    'g');

  -- Fonctions sans argument : encapsulées si elles ne le sont pas déjà.
  r := regexp_replace(r, '(?<!SELECT )(?<![a-z0-9_.])(?:public\.)?is_content_moderator\(\)', '( SELECT public.is_content_moderator())', 'g');
  r := regexp_replace(r, '(?<!SELECT )(?<![a-z0-9_.])(?:public\.)?is_current_user_admin\(\)', '( SELECT public.is_current_user_admin())', 'g');
  r := regexp_replace(r, '(?<!SELECT )(?<![a-z0-9_.])auth\.uid\(\)', '( SELECT auth.uid())', 'g');
  r := regexp_replace(r, '(?<!SELECT )(?<![a-z0-9_.])auth\.jwt\(\)', '( SELECT auth.jwt())', 'g');
  r := regexp_replace(r, '(?<!SELECT )(?<![a-z0-9_.])auth\.role\(\)', '( SELECT auth.role())', 'g');
  return r;
end $$;

do $$
declare
  p record;
  new_qual text;
  new_check text;
  sql text;
  changed integer := 0;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual  := pg_temp.v1653_optimize(p.qual);
    new_check := pg_temp.v1653_optimize(p.with_check);

    if new_qual is distinct from p.qual or new_check is distinct from p.with_check then
      sql := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
      if new_qual is not null then sql := sql || format(' using (%s)', new_qual); end if;
      if new_check is not null then sql := sql || format(' with check (%s)', new_check); end if;
      execute sql;
      changed := changed + 1;
    end if;
  end loop;
  raise notice 'V1.6.53 : % règles RLS optimisées', changed;
end $$;

-- 4) Index sur les colonnes utilisées par l'appli et les règles (créés seulement s'ils manquent).
create or replace function pg_temp.v1653_index(p_table text, p_cols text, p_name text)
returns void language plpgsql as $$
declare first_col text := split_part(p_cols, ',', 1);
begin
  if to_regclass('public.' || p_table) is null then return; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = trim(split_part(first_col, ' ', 1))
  ) then return; end if;
  -- Un index existant qui commence déjà par cette colonne suffit.
  if exists (
    select 1
    from pg_index i
    join pg_class t on t.oid = i.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = i.indkey[0]
    where n.nspname = 'public' and t.relname = p_table and a.attname = trim(split_part(first_col, ' ', 1))
  ) then return; end if;
  execute format('create index if not exists %I on public.%I (%s)', p_name, p_table, p_cols);
end $$;

select pg_temp.v1653_index('profiles',            'role',                      'v1653_profiles_role_idx');
select pg_temp.v1653_index('notifications',       'user_id, created_at desc',  'v1653_notifications_user_created_idx');
select pg_temp.v1653_index('comments',            'post_id',                   'v1653_comments_post_idx');
select pg_temp.v1653_index('comments',            'idea_id',                   'v1653_comments_idea_idx');
select pg_temp.v1653_index('comments',            'created_at desc',           'v1653_comments_created_idx');
select pg_temp.v1653_index('messages',            'receiver_id',               'v1653_messages_receiver_idx');
select pg_temp.v1653_index('messages',            'sender_id',                 'v1653_messages_sender_idx');
select pg_temp.v1653_index('posts',               'created_at desc',           'v1653_posts_created_idx');
select pg_temp.v1653_index('transactions',        'user_id',                   'v1653_transactions_user_idx');
select pg_temp.v1653_index('moods',               'user_id',                   'v1653_moods_user_idx');
select pg_temp.v1653_index('game_completions',    'user_id',                   'v1653_game_completions_user_idx');
select pg_temp.v1653_index('advent_openings',     'user_id',                   'v1653_advent_openings_user_idx');

commit;

analyze;

-- Vérification : doit afficher 0 (plus aucun appel non encapsulé).
select count(*) as regles_non_optimisees
from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') ~ '(?<!SELECT )(?<![a-z0-9_.])(auth\.uid\(\)|is_content_moderator\(\)|is_current_user_admin\(\)|can_view_company_audience\()'
    or coalesce(with_check, '') ~ '(?<!SELECT )(?<![a-z0-9_.])(auth\.uid\(\)|is_content_moderator\(\)|is_current_user_admin\(\)|can_view_company_audience\()');

-- ---------------------------------------------------------------------------
-- RETOUR ARRIÈRE (seulement en cas de problème) : décommenter et exécuter.
-- do $$
-- declare b record; sql text;
-- begin
--   for b in select * from public._policy_backup_v1653 loop
--     sql := format('alter policy %I on %I.%I', b.policyname, b.schemaname, b.tablename);
--     if b.qual is not null then sql := sql || format(' using (%s)', b.qual); end if;
--     if b.with_check is not null then sql := sql || format(' with check (%s)', b.with_check); end if;
--     execute sql;
--   end loop;
-- end $$;
