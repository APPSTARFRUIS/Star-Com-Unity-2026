-- Star ComUnity — Organisation Groupe V3
-- Fiches collaborateurs enrichies + données PDF interactif
-- À exécuter UNE FOIS dans Supabase > SQL Editor APRÈS le déploiement.

alter table public.profiles
  add column if not exists job_description text null;

alter table public.profiles
  add column if not exists personal_note text null;

alter table public.org_contacts
  add column if not exists job_description text null;

alter table public.org_contacts
  add column if not exists personal_note text null;

comment on column public.profiles.job_description is
  'Présentation du métier, missions et activités du collaborateur';

comment on column public.profiles.personal_note is
  'Anecdote ou information personnelle destinée à la fiche collaborateur';
