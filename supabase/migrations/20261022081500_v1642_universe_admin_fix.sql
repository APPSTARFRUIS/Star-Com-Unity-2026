-- V1.6.42 corrective — admin-driven universes and audiences
alter table public.mascot_experiences
  add column if not exists decor_image_url text,
  add column if not exists all_users boolean not null default true,
  add column if not exists companies text[] not null default '{}'::text[];

update public.mascot_experiences
set all_users = true
where all_users is null;
