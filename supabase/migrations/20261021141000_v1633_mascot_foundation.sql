-- V1.6.33 — Ma Poire / Dressing / Collections
create table if not exists public.mascots (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 30), origin text not null default 'STAR_COMMUNITY' check (origin in ('STAR_COMMUNITY','STAR_T')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.mascot_collections (
 id uuid primary key default gen_random_uuid(), name text not null, description text, image_url text,
 starts_at timestamptz, ends_at timestamptz, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.mascot_items (
 id uuid primary key default gen_random_uuid(), name text not null, description text, image_url text,
 category text not null check(category in ('glasses','hat','clothing','shoes','accessory','background','souvenir')),
 collection_id uuid references public.mascot_collections(id) on delete set null,
 acquisition_type text not null default 'purchase' check(acquisition_type in ('purchase','unlock','gift')),
 price_points integer not null default 0 check(price_points>=0), rarity text not null default 'Commun', active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.mascot_user_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 item_id uuid not null references public.mascot_items(id) on delete cascade, acquisition_method text not null check(acquisition_method in ('purchase','unlock','gift')),
 equipped boolean not null default false, acquired_at timestamptz not null default now(), unique(user_id,item_id)
);
create table if not exists public.mascot_reward_rules (
 id uuid primary key default gen_random_uuid(), name text not null, item_id uuid not null references public.mascot_items(id) on delete cascade,
 trigger_type text not null, trigger_ref text, active boolean not null default true, created_at timestamptz not null default now()
);

alter table public.mascots enable row level security; alter table public.mascot_collections enable row level security; alter table public.mascot_items enable row level security; alter table public.mascot_user_items enable row level security; alter table public.mascot_reward_rules enable row level security;
revoke all on public.mascots,public.mascot_collections,public.mascot_items,public.mascot_user_items,public.mascot_reward_rules from anon;
grant select,insert,update on public.mascots to authenticated; grant select on public.mascot_collections,public.mascot_items to authenticated; grant select,insert,update on public.mascot_user_items to authenticated; grant select on public.mascot_reward_rules to authenticated;
grant insert,update,delete on public.mascot_collections,public.mascot_items,public.mascot_reward_rules to authenticated;

drop policy if exists mascot_self on public.mascots; create policy mascot_self on public.mascots for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists mascot_collections_read on public.mascot_collections; create policy mascot_collections_read on public.mascot_collections for select to authenticated using(true);
drop policy if exists mascot_collections_admin on public.mascot_collections; create policy mascot_collections_admin on public.mascot_collections for all to authenticated using(public.is_content_moderator()) with check(public.is_content_moderator());
drop policy if exists mascot_items_read on public.mascot_items; create policy mascot_items_read on public.mascot_items for select to authenticated using(true);
drop policy if exists mascot_items_admin on public.mascot_items; create policy mascot_items_admin on public.mascot_items for all to authenticated using(public.is_content_moderator()) with check(public.is_content_moderator());
drop policy if exists mascot_owned_read on public.mascot_user_items; create policy mascot_owned_read on public.mascot_user_items for select to authenticated using(user_id=auth.uid() or public.is_content_moderator());
drop policy if exists mascot_owned_update on public.mascot_user_items; create policy mascot_owned_update on public.mascot_user_items for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists mascot_owned_admin_insert on public.mascot_user_items; create policy mascot_owned_admin_insert on public.mascot_user_items for insert to authenticated with check(public.is_content_moderator());
drop policy if exists mascot_rules_read on public.mascot_reward_rules; create policy mascot_rules_read on public.mascot_reward_rules for select to authenticated using(true);
drop policy if exists mascot_rules_admin on public.mascot_reward_rules; create policy mascot_rules_admin on public.mascot_reward_rules for all to authenticated using(public.is_content_moderator()) with check(public.is_content_moderator());

create or replace function public.claim_mascot_item(p_item_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_item public.mascot_items%rowtype; v_points integer;
begin
 if v_user is null then raise exception 'Not authenticated'; end if;
 select * into v_item from public.mascot_items where id=p_item_id and active=true for update;
 if not found or v_item.acquisition_type<>'purchase' then raise exception 'Item unavailable'; end if;
 if exists(select 1 from public.mascot_user_items where user_id=v_user and item_id=p_item_id) then raise exception 'Already owned'; end if;
 select points into v_points from public.profiles where id=v_user for update;
 if coalesce(v_points,0)<v_item.price_points then raise exception 'Insufficient points'; end if;
 update public.profiles set points=points-v_item.price_points where id=v_user;
 insert into public.mascot_user_items(user_id,item_id,acquisition_method) values(v_user,p_item_id,'purchase');
 insert into public.transactions(user_id,amount,reason,date,type) values(v_user,-v_item.price_points,'Mascotte : '||v_item.name,now(),'spend');
 return jsonb_build_object('remaining_points',v_points-v_item.price_points,'item_id',p_item_id);
end$$;
revoke all on function public.claim_mascot_item(uuid) from public,anon; grant execute on function public.claim_mascot_item(uuid) to authenticated;
