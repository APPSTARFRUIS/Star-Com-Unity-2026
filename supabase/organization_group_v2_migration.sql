-- Star ComUnity — Organisation Groupe V2
-- À exécuter UNE FOIS dans Supabase > SQL Editor APRÈS le déploiement du ZIP.

create extension if not exists pgcrypto;

create table if not exists public.org_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  entity_type text not null check (entity_type in ('group','subsidiary','shareholder')),
  parent_id uuid null references public.org_entities(id) on delete set null,
  logo_url text null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.org_services (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.org_entities(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  unique(entity_id,name)
);
create table if not exists public.org_contacts (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.org_entities(id) on delete cascade,
  name text not null,
  email text null,
  phone text null,
  job_title text null,
  avatar_url text null,
  about text null,
  sort_order integer not null default 0
);

alter table public.org_entities enable row level security;
alter table public.org_services enable row level security;
alter table public.org_contacts enable row level security;

drop policy if exists "org_entities_read" on public.org_entities;
create policy "org_entities_read" on public.org_entities for select to authenticated using (true);
drop policy if exists "org_services_read" on public.org_services;
create policy "org_services_read" on public.org_services for select to authenticated using (true);
drop policy if exists "org_contacts_read" on public.org_contacts;
create policy "org_contacts_read" on public.org_contacts for select to authenticated using (true);

create or replace function public.is_current_user_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN');
$$;
grant execute on function public.is_current_user_admin() to authenticated;

drop policy if exists "org_entities_admin_write" on public.org_entities;
create policy "org_entities_admin_write" on public.org_entities for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
drop policy if exists "org_services_admin_write" on public.org_services;
create policy "org_services_admin_write" on public.org_services for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
drop policy if exists "org_contacts_admin_write" on public.org_contacts;
create policy "org_contacts_admin_write" on public.org_contacts for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- Seed structure de base. Les actionnaires pépiniéristes sont volontairement créés depuis l'admin.
insert into public.org_entities(name,entity_type,parent_id,sort_order)
values ('Star Group','group',null,1)
on conflict(name) do nothing;
insert into public.org_entities(name,entity_type,parent_id,sort_order)
select v.name,'subsidiary',g.id,v.ord from (values
 ('Star Fruits',2),('Star Export',3),('Star PMP',4),('AC Fruit',5),('Eurostème',6)
) as v(name,ord), public.org_entities g where g.name='Star Group'
on conflict(name) do nothing;

-- Services Star Fruits existants uniquement. Les autres structures démarrent vides : aucun mélange de services.
insert into public.org_services(entity_id,name,sort_order)
select e.id,v.name,v.ord from public.org_entities e cross join (values
 ('Direction',1),('Service Administratif, RH & Financier',2),('Service Communication',3),('Service Qualité',4),('Pôle Variétal',5),('Service Variétés Filière',6),('Pôle Marques',7)
) as v(name,ord) where e.name='Star Fruits'
on conflict(entity_id,name) do nothing;

-- Star Group : service Direction par défaut seulement.
insert into public.org_services(entity_id,name,sort_order)
select id,'Direction',1 from public.org_entities where name='Star Group'
on conflict(entity_id,name) do nothing;

-- Cloisonnement des contenus ciblables.
alter table public.documents add column if not exists audience_companies text[] not null default array['Star Fruits'];
alter table public.polls add column if not exists audience_companies text[] not null default array['Star Fruits'];
alter table public.events add column if not exists audience_companies text[] not null default array['Star Fruits'];
update public.documents set audience_companies=array['Star Fruits'] where audience_companies is null or cardinality(audience_companies)=0;
update public.polls set audience_companies=array['Star Fruits'] where audience_companies is null or cardinality(audience_companies)=0;
update public.events set audience_companies=array['Star Fruits'] where audience_companies is null or cardinality(audience_companies)=0;

create or replace function public.can_view_company_audience(p_audience text[])
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_current_user_admin()
  or 'ALL'=any(coalesce(p_audience,array[]::text[]))
  or exists(select 1 from public.profiles p, unnest(coalesce(p_audience,array[]::text[])) c where p.id=auth.uid() and lower(trim(coalesce(p.company,'')))=lower(trim(c)));
$$;
grant execute on function public.can_view_company_audience(text[]) to authenticated;

-- Suppression des anciennes policies SELECT permissives connues.
drop policy if exists "Anyone can view documents" on public.documents;
drop policy if exists "Users can view documents" on public.documents;
drop policy if exists "Users can view their own documents" on public.documents;
drop policy if exists "documents_select_by_company" on public.documents;
create policy "documents_select_by_company" on public.documents for select to authenticated using (public.can_view_company_audience(audience_companies));

drop policy if exists "Anyone can view polls" on public.polls;
drop policy if exists "polls_select_by_company" on public.polls;
create policy "polls_select_by_company" on public.polls for select to authenticated using (public.can_view_company_audience(audience_companies));

drop policy if exists "Anyone can view events" on public.events;
drop policy if exists "events_select_by_company" on public.events;
create policy "events_select_by_company" on public.events for select to authenticated using (public.can_view_company_audience(audience_companies));

-- Notifications événements/sondages : uniquement l'audience concernée, ou tous si ALL.
create or replace function public.notify_audience_profiles(p_kind text,p_title text,p_message text,p_link_view text,p_entity_id text,p_exclude_user uuid,p_audience text[])
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into public.notifications(user_id,kind,title,message,link_view,entity_id,is_read,created_at)
 select p.id,p_kind,p_title,p_message,p_link_view,p_entity_id,false,now()
 from public.profiles p
 where (p_exclude_user is null or p.id<>p_exclude_user)
 and ('ALL'=any(coalesce(p_audience,array[]::text[])) or exists(select 1 from unnest(coalesce(p_audience,array[]::text[])) c where lower(trim(c))=lower(trim(coalesce(p.company,'')))));
end;$$;

create or replace function public.notify_new_event() returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.notify_audience_profiles('event','Nouvel événement',new.title,'evenements',new.id::text,new.created_by,new.audience_companies); return new; end;$$;
create or replace function public.notify_new_poll() returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.notify_audience_profiles('poll','Nouveau sondage',new.title,'sondages',new.id::text,new.created_by,new.audience_companies); return new; end;$$;

-- Newsletter + Jeux : aucune colonne audience ajoutée, ils restent communs à tous.
