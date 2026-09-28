-- PlanEat - Étape 6 : administration sécurisée et catalogue partagé
-- À exécuter une seule fois après 001_initial_schema.sql.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.app_essentials (
  id text primary key,
  data jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.app_essentials enable row level security;

-- Un utilisateur peut uniquement savoir s'il est lui-même administrateur.
do $$ begin
  create policy "admin_users_select_self" on public.admin_users
    for select to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Catalogue lisible par tous les utilisateurs connectés (y compris les sessions anonymes).
do $$ begin
  create policy "app_essentials_read_authenticated" on public.app_essentials
    for select to authenticated using (is_active = true);
exception when duplicate_object then null; end $$;

-- Seuls les utilisateurs présents dans admin_users peuvent écrire le catalogue recettes/essentiels.
do $$ begin
  create policy "recipes_admin_insert" on public.recipes for insert to authenticated
    with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "recipes_admin_update" on public.recipes for update to authenticated
    using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
    with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "recipes_admin_delete" on public.recipes for delete to authenticated
    using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "app_essentials_admin_insert" on public.app_essentials for insert to authenticated
    with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "app_essentials_admin_update" on public.app_essentials for update to authenticated
    using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
    with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "app_essentials_admin_delete" on public.app_essentials for delete to authenticated
    using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- Projet neuf : promouvoir automatiquement le premier compte permanent créé.
-- Cela évite de coder une adresse e-mail dans le dépôt. Si aucun compte permanent n'existe encore,
-- cette instruction ne fait rien et vous pourrez insérer manuellement l'UUID voulu plus tard.
insert into public.admin_users (user_id)
select id from auth.users
where coalesce(is_anonymous, false) = false
order by created_at asc
limit 1
on conflict do nothing;
