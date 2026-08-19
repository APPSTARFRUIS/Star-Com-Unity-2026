-- Star ComUnity V1.3 — création de contenus par les utilisateurs
-- Les utilisateurs authentifiés peuvent créer événements, documents, sondages et célébrations.
-- La suppression reste réservée aux ADMIN / MODERATEUR.
-- Pour les contenus cloisonnés, un USER peut publier pour :
--   - Commun à tous (ALL)
--   - sa propre entreprise
-- Un ADMIN/MODERATEUR peut cibler toute structure.

create or replace function public.is_content_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('ADMIN', 'MODERATEUR')
  );
$$;

grant execute on function public.is_content_moderator() to authenticated;

create or replace function public.can_create_company_audience(p_audience text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_content_moderator()
    or 'ALL' = any(coalesce(p_audience, array[]::text[]))
    or (
      cardinality(coalesce(p_audience, array[]::text[])) > 0
      and not exists (
        select 1
        from unnest(coalesce(p_audience, array[]::text[])) audience_company
        where lower(trim(audience_company)) <> lower(trim(coalesce((
          select p.company from public.profiles p where p.id = auth.uid()
        ), '')))
      )
    );
$$;

grant execute on function public.can_create_company_audience(text[]) to authenticated;

-- EVENTS
drop policy if exists "Anyone can create events" on public.events;
drop policy if exists "Users can create events" on public.events;
drop policy if exists "events_insert_authenticated" on public.events;

create policy "events_insert_authenticated"
on public.events for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_create_company_audience(audience_companies)
);

drop policy if exists "Anyone can delete events" on public.events;
drop policy if exists "Users can delete events" on public.events;
drop policy if exists "events_delete_moderators" on public.events;

create policy "events_delete_moderators"
on public.events for delete to authenticated
using (public.is_content_moderator());

-- DOCUMENTS
drop policy if exists "Anyone can upload documents" on public.documents;
drop policy if exists "Users can upload documents" on public.documents;
drop policy if exists "Authenticated users can upload documents" on public.documents;
drop policy if exists "documents_insert_authenticated" on public.documents;

create policy "documents_insert_authenticated"
on public.documents for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and public.can_create_company_audience(audience_companies)
);

drop policy if exists "Anyone can delete documents" on public.documents;
drop policy if exists "Users can delete documents" on public.documents;
drop policy if exists "documents_delete_moderators" on public.documents;

create policy "documents_delete_moderators"
on public.documents for delete to authenticated
using (public.is_content_moderator());

-- POLLS
drop policy if exists "Anyone can create polls" on public.polls;
drop policy if exists "Users can create polls" on public.polls;
drop policy if exists "Insertion pour admins et modérateurs" on public.polls;
drop policy if exists "polls_insert_authenticated" on public.polls;

create policy "polls_insert_authenticated"
on public.polls for insert to authenticated
with check (
  created_by = auth.uid()::text
  and public.can_create_company_audience(audience_companies)
);

drop policy if exists "Anyone can delete polls" on public.polls;
drop policy if exists "Users can delete polls" on public.polls;
drop policy if exists "polls_delete_moderators" on public.polls;

create policy "polls_delete_moderators"
on public.polls for delete to authenticated
using (public.is_content_moderator());

-- CELEBRATIONS (contenu global)
drop policy if exists "Anyone can create celebrations" on public.celebrations;
drop policy if exists "Users can create celebrations" on public.celebrations;
drop policy if exists "celebrations_insert_authenticated" on public.celebrations;

create policy "celebrations_insert_authenticated"
on public.celebrations for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "Anyone can delete celebrations" on public.celebrations;
drop policy if exists "Users can delete celebrations" on public.celebrations;
drop policy if exists "celebrations_delete_moderators" on public.celebrations;

create policy "celebrations_delete_moderators"
on public.celebrations for delete to authenticated
using (public.is_content_moderator());
