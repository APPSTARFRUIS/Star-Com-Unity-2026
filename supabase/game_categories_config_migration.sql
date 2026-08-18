-- Star ComUnity — catégories Jeux administrables
-- À exécuter UNE FOIS dans Supabase > SQL Editor.

alter table public.app_config
  add column if not exists game_categories text[] not null
  default array['Produits','Histoire','Valeurs','Processus']::text[];

update public.app_config
set game_categories = array['Produits','Histoire','Valeurs','Processus']::text[]
where game_categories is null or cardinality(game_categories) = 0;
