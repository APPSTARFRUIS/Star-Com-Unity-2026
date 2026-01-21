-- 1. Activation de l'extension pour les identifiants uniques
create extension if not exists "uuid-ossp";

-- 2. Création de la table 'polls'
create table if not exists public.polls (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  questions jsonb default '[]'::jsonb,
  settings jsonb default '{"collectEmail": false, "limitOneResponse": true, "showResults": true}'::jsonb,
  responses jsonb default '[]'::jsonb,
  end_date timestamp with time zone,
  created_by text, 
  created_by_name text,
  target_departments jsonb default '["Tous"]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Activation de la sécurité (RLS)
alter table public.polls enable row level security;

-- 4. Nettoyage des anciennes politiques si elles existent
drop policy if exists "Lecture publique pour les authentifiés" on public.polls;
drop policy if exists "Insertion pour admins et modérateurs" on public.polls;
drop policy if exists "Vote autorisé pour tous" on public.polls;
drop policy if exists "Suppression pour admins" on public.polls;

-- 5. Création des politiques de sécurité
-- Tout utilisateur connecté peut voir les sondages
create policy "Lecture publique pour les authentifiés" 
on public.polls for select 
using (auth.role() = 'authenticated');

-- Seuls les admins et modérateurs peuvent créer des sondages
create policy "Insertion pour admins et modérateurs" 
on public.polls for insert 
with check (
  exists (
    select 1 from public.profiles 
    where id::text = auth.uid()::text 
    and (role = 'ADMIN' or role = 'MODERATEUR')
  )
);

-- Tout le monde peut voter (mettre à jour la colonne 'responses')
create policy "Vote autorisé pour tous" 
on public.polls for update 
using (auth.role() = 'authenticated');

-- Seuls les admins peuvent supprimer un sondage
create policy "Suppression pour admins" 
on public.polls for delete 
using (
  exists (
    select 1 from public.profiles 
    where id::text = auth.uid()::text 
    and role = 'ADMIN'
  )
);

-- 6. Attribution des permissions aux rôles API
grant all on table public.polls to postgres, service_role;
grant select, insert, update, delete on table public.polls to authenticated;