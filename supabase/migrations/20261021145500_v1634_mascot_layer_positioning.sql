-- V1.6.34 — Positionnement visuel des accessoires de mascotte
alter table public.mascot_items add column if not exists layer_x numeric not null default 50;
alter table public.mascot_items add column if not exists layer_y numeric not null default 50;
alter table public.mascot_items add column if not exists layer_width numeric not null default 45;
alter table public.mascot_items add column if not exists layer_rotation numeric not null default 0;
alter table public.mascot_items add column if not exists pair_mode boolean not null default false;
alter table public.mascot_items add column if not exists pair_gap numeric not null default 13;

-- Valeurs initiales adaptées aux catégories pour les objets déjà créés.
update public.mascot_items set layer_x=50, layer_y=48, layer_width=48 where category='glasses' and layer_y=50;
update public.mascot_items set layer_x=50, layer_y=18, layer_width=54 where category='hat' and layer_y=50;
update public.mascot_items set layer_x=50, layer_y=65, layer_width=62 where category='clothing' and layer_y=50;
update public.mascot_items set layer_x=50, layer_y=88, layer_width=25, pair_mode=true, pair_gap=13 where category='shoes' and layer_y=50;
update public.mascot_items set layer_x=50, layer_y=62, layer_width=38 where category='accessory' and layer_y=50;
update public.mascot_items set layer_x=50, layer_y=50, layer_width=100 where category='background' and layer_y=50;
