-- Stabilisation du module Utilisateurs
-- Le mot de passe appartient exclusivement à Supabase Auth.

alter table public.profiles
  add column if not exists company text default 'Star Fruits';

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists job_function text;

-- Les anciens mots de passe stockés en clair dans profiles ne sont ni sûrs,
-- ni utilisés par Supabase Auth.
alter table public.profiles
  drop column if exists password;

update public.profiles
set company = 'Star Fruits'
where lower(trim(coalesce(company, ''))) in ('star fruits', 'star fruit');

create unique index if not exists idx_profiles_email_unique_lower
  on public.profiles(lower(email));
