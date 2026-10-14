-- V1.6.20 - Onboarding première connexion
-- Persistant par utilisateur, quel que soit l'appareil utilisé.
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz null;

comment on column public.profiles.onboarding_completed_at is
  'Date de validation de la présentation de première connexion Star Com''Unity.';
