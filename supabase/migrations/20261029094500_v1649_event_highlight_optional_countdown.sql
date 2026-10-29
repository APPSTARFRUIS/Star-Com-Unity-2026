-- V1.6.49 — Compte à rebours optionnel pour les événements de type Temps fort
-- Colonne nullable volontairement : NULL = ancien Temps fort, donc comportement historique conservé.
alter table public.events
  add column if not exists show_countdown boolean;

comment on column public.events.show_countdown is
  'Pour un événement Temps fort : true affiche le compte à rebours, false le masque, null conserve le comportement historique.';
