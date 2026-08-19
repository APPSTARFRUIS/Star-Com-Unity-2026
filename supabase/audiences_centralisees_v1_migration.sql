-- Star ComUnity — Audiences centralisées V1
-- Documents + Sondages + Événements + Boîte à idées
-- Newsletter et Jeux/e-learning restent volontairement communs à tous.
-- Script réexécutable.

-- 1) Colonnes d'audience.
alter table public.documents
  add column if not exists audience_companies text[] not null default array['Star Fruits'];

alter table public.polls
  add column if not exists audience_companies text[] not null default array['Star Fruits'];

alter table public.events
  add column if not exists audience_companies text[] not null default array['Star Fruits'];

alter table public.ideas
  add column if not exists audience_companies text[] not null default array['Star Fruits'];

-- Les données historiques proviennent de l'application Star Fruits.
update public.documents set audience_companies = array['Star Fruits']
where audience_companies is null or cardinality(audience_companies) = 0;

update public.polls set audience_companies = array['Star Fruits']
where audience_companies is null or cardinality(audience_companies) = 0;

update public.events set audience_companies = array['Star Fruits']
where audience_companies is null or cardinality(audience_companies) = 0;

update public.ideas set audience_companies = array['Star Fruits']
where audience_companies is null or cardinality(audience_companies) = 0;

create index if not exists idx_documents_audience_companies on public.documents using gin(audience_companies);
create index if not exists idx_polls_audience_companies on public.polls using gin(audience_companies);
create index if not exists idx_events_audience_companies on public.events using gin(audience_companies);
create index if not exists idx_ideas_audience_companies on public.ideas using gin(audience_companies);

-- 2) Fonction unique de visibilité.
create or replace function public.can_view_company_audience(p_audience text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'ADMIN'
    )
    or 'ALL' = any(coalesce(p_audience, array[]::text[]))
    or exists (
      select 1
      from public.profiles p,
           unnest(coalesce(p_audience, array[]::text[])) audience_company
      where p.id = auth.uid()
        and lower(trim(coalesce(p.company, ''))) = lower(trim(audience_company))
    );
$$;

grant execute on function public.can_view_company_audience(text[]) to authenticated;

-- 3) RLS : le serveur applique le même cloisonnement que l'interface.
alter table public.documents enable row level security;
alter table public.polls enable row level security;
alter table public.events enable row level security;
alter table public.ideas enable row level security;

drop policy if exists "documents_select_by_company" on public.documents;
drop policy if exists "Anyone can view documents" on public.documents;
drop policy if exists "Users can view documents" on public.documents;
create policy "documents_select_by_company"
  on public.documents for select to authenticated
  using (public.can_view_company_audience(audience_companies));

drop policy if exists "polls_select_by_company" on public.polls;
drop policy if exists "Anyone can view polls" on public.polls;
drop policy if exists "Users can view polls" on public.polls;
create policy "polls_select_by_company"
  on public.polls for select to authenticated
  using (public.can_view_company_audience(audience_companies));

drop policy if exists "events_select_by_company" on public.events;
drop policy if exists "Anyone can view events" on public.events;
drop policy if exists "Users can view events" on public.events;
create policy "events_select_by_company"
  on public.events for select to authenticated
  using (public.can_view_company_audience(audience_companies));

drop policy if exists "ideas_select_by_company" on public.ideas;
drop policy if exists "Anyone can view ideas" on public.ideas;
drop policy if exists "Users can view ideas" on public.ideas;
create policy "ideas_select_by_company"
  on public.ideas for select to authenticated
  using (public.can_view_company_audience(audience_companies));

-- 4) Notifications : même audience + respect des préférences in-app.
create or replace function public.notify_audience_profiles_with_preferences(
  p_kind text,
  p_title text,
  p_message text,
  p_link_view text,
  p_entity_id text,
  p_excluded_user_id uuid,
  p_audience text[],
  p_preference_key text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
  select
    p.id::text,
    p_kind,
    p_title,
    p_message,
    p_link_view,
    p_entity_id
  from public.profiles p
  where
    (p_excluded_user_id is null or p.id <> p_excluded_user_id)
    and coalesce((p.notification_settings->>'inApp')::boolean, true)
    and (
      p_preference_key is null
      or coalesce((p.notification_settings->>p_preference_key)::boolean, true)
    )
    and (
      'ALL' = any(coalesce(p_audience, array[]::text[]))
      or exists (
        select 1
        from unnest(coalesce(p_audience, array[]::text[])) company_name
        where lower(trim(company_name)) = lower(trim(coalesce(p.company, '')))
      )
    );
$$;

create or replace function public.notify_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'event', 'Nouvel événement', new.title,
    'evenements', new.id::text, new.created_by,
    new.audience_companies, 'events'
  );
  return new;
end;
$$;

create or replace function public.notify_new_poll()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'poll', 'Nouveau sondage', new.title,
    'sondages', new.id::text, new.created_by,
    new.audience_companies, 'polls'
  );
  return new;
end;
$$;

create or replace function public.notify_new_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'document', 'Nouveau document', new.name,
    'documents', new.id::text, new.uploaded_by,
    new.audience_companies, null
  );
  return new;
end;
$$;

create or replace function public.notify_new_idea()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'idea', 'Nouvelle idée', new.title,
    'idees', new.id::text, new.user_id,
    new.audience_companies, null
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_event on public.events;
create trigger trg_notify_new_event
after insert on public.events
for each row execute function public.notify_new_event();

drop trigger if exists trg_notify_new_poll on public.polls;
create trigger trg_notify_new_poll
after insert on public.polls
for each row execute function public.notify_new_poll();

drop trigger if exists trg_notify_new_document on public.documents;
create trigger trg_notify_new_document
after insert on public.documents
for each row execute function public.notify_new_document();

drop trigger if exists trg_notify_new_idea on public.ideas;
create trigger trg_notify_new_idea
after insert on public.ideas
for each row execute function public.notify_new_idea();

-- 5) Newsletter et Jeux/e-learning : volontairement inchangés/globalisés.
