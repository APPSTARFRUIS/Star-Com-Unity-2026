-- Star Com'Unity V1.6.32 — Correctif RLS fonctionnel après V1.6.29
-- Restaure les droits des utilisateurs authentifiés supprimés involontairement
-- lorsque les anciennes policies mixtes anon/authenticated ont été retirées.
-- Aucun contenu métier n'est supprimé.

-- Ensure authenticated has the SQL privileges required for these RLS policies.
do $$
declare t text;
begin
  foreach t in array array['ideas','events','documents','polls','celebrations'] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
      execute format('revoke all on table public.%I from anon', t);
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- IDEAS
-- All signed-in staff can read, submit ideas and vote. Only author/moderator can delete.
drop policy if exists "v1632 ideas select" on public.ideas;
drop policy if exists "v1632 ideas insert" on public.ideas;
drop policy if exists "v1632 ideas update" on public.ideas;
drop policy if exists "v1632 ideas delete" on public.ideas;
create policy "v1632 ideas select" on public.ideas for select to authenticated using (true);
create policy "v1632 ideas insert" on public.ideas for insert to authenticated
  with check (user_id = auth.uid());
-- Updates are needed by the existing vote mechanism. Administrative status controls remain UI-restricted.
create policy "v1632 ideas update" on public.ideas for update to authenticated
  using (true) with check (true);
create policy "v1632 ideas delete" on public.ideas for delete to authenticated
  using (user_id = auth.uid() or public.is_content_moderator());

-- EVENTS
-- Signed-in staff can read and update attendance. Creation/deletion is limited to moderator/admin
-- or the creator, preserving the existing event UI behaviour.
drop policy if exists "v1632 events select" on public.events;
drop policy if exists "v1632 events insert" on public.events;
drop policy if exists "v1632 events update" on public.events;
drop policy if exists "v1632 events delete" on public.events;
create policy "v1632 events select" on public.events for select to authenticated using (true);
create policy "v1632 events insert" on public.events for insert to authenticated
  with check (created_by = auth.uid() and public.is_content_moderator());
-- Required for participant self-registration in the current client.
create policy "v1632 events update" on public.events for update to authenticated
  using (true) with check (true);
create policy "v1632 events delete" on public.events for delete to authenticated
  using (created_by = auth.uid() or public.is_content_moderator());

-- DOCUMENTS
-- Everyone signed in can read. Upload belongs to the authenticated user; moderators are allowed
-- as well to remain compatible with legacy/admin-created records.
drop policy if exists "v1632 documents select" on public.documents;
drop policy if exists "v1632 documents insert" on public.documents;
drop policy if exists "v1632 documents update" on public.documents;
drop policy if exists "v1632 documents delete" on public.documents;
create policy "v1632 documents select" on public.documents for select to authenticated using (true);
create policy "v1632 documents insert" on public.documents for insert to authenticated
  with check (uploaded_by = auth.uid() or public.is_content_moderator());
create policy "v1632 documents update" on public.documents for update to authenticated
  using (uploaded_by = auth.uid() or public.is_content_moderator())
  with check (uploaded_by = auth.uid() or public.is_content_moderator());
create policy "v1632 documents delete" on public.documents for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_content_moderator());

-- POLLS
-- Everyone signed in can read and submit a response through the existing JSON response mechanism.
-- Creation/deletion stays moderator/admin only.
drop policy if exists "v1632 polls select" on public.polls;
drop policy if exists "v1632 polls insert" on public.polls;
drop policy if exists "v1632 polls update" on public.polls;
drop policy if exists "v1632 polls delete" on public.polls;
create policy "v1632 polls select" on public.polls for select to authenticated using (true);
create policy "v1632 polls insert" on public.polls for insert to authenticated
  with check (public.is_content_moderator());
-- Required because responses are currently stored in polls.responses JSON.
create policy "v1632 polls update" on public.polls for update to authenticated
  using (true) with check (true);
create policy "v1632 polls delete" on public.polls for delete to authenticated
  using (public.is_content_moderator());

-- CELEBRATIONS
-- Everyone signed in can read and like. Publishing is allowed to moderators/admins; legacy birthday
-- interactions keep working because likes are stored on the celebration row.
drop policy if exists "v1632 celebrations select" on public.celebrations;
drop policy if exists "v1632 celebrations insert" on public.celebrations;
drop policy if exists "v1632 celebrations update" on public.celebrations;
drop policy if exists "v1632 celebrations delete" on public.celebrations;
create policy "v1632 celebrations select" on public.celebrations for select to authenticated using (true);
create policy "v1632 celebrations insert" on public.celebrations for insert to authenticated
  with check (created_by = auth.uid() and public.is_content_moderator());
-- Required for likes / wishes in the current data model.
create policy "v1632 celebrations update" on public.celebrations for update to authenticated
  using (true) with check (true);
create policy "v1632 celebrations delete" on public.celebrations for delete to authenticated
  using (created_by = auth.uid() or public.is_content_moderator());
