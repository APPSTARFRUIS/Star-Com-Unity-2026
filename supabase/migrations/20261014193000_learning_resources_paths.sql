-- V1.6.14 - rattachement des ressources aux parcours e-learning
alter table if exists public.learning_resources
  add column if not exists learning_path text,
  add column if not exists level_number integer;

alter table if exists public.learning_resources
  drop constraint if exists learning_resources_level_number_check;

alter table if exists public.learning_resources
  add constraint learning_resources_level_number_check
  check (level_number is null or level_number >= 1);

create index if not exists learning_resources_learning_path_level_idx
  on public.learning_resources (learning_path, level_number);
