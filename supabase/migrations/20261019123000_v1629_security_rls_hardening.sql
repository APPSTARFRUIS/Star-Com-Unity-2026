-- Star Com'Unity V1.6.29 — Security / RLS hardening
-- Idempotent. Does not delete business data.

-- 1) Passwords must never live in public.profiles.
alter table if exists public.profiles drop column if exists password;

-- 2) Common authorization helper.
create or replace function public.is_content_moderator()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('ADMIN','MODERATEUR')
  );
$$;
grant execute on function public.is_content_moderator() to authenticated;

-- 3) Remove every legacy policy that explicitly granted access to anon
-- on application tables. New authenticated policies below replace the needed access.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'profiles','posts','comments','ideas','events','messages','documents','polls',
        'moods','celebrations','rewards','transactions','app_config','notifications'
      ])
      and 'anon' = any(roles)
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Revoke direct anonymous table access for the application domain.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','posts','comments','ideas','events','messages','documents','polls',
    'moods','celebrations','rewards','transactions','app_config','notifications',
    'learning_resources','games','game_predictions','game_completions','game_point_awards',
    'push_subscriptions','org_entities','org_services','org_contacts'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke all on table public.%I from anon', t);
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- PROFILES: directory readable by signed-in staff; own profile editable;
-- admins/moderators may manage profiles.
drop policy if exists "v1629 profiles select" on public.profiles;
drop policy if exists "v1629 profiles insert" on public.profiles;
drop policy if exists "v1629 profiles update" on public.profiles;
drop policy if exists "v1629 profiles delete" on public.profiles;
create policy "v1629 profiles select" on public.profiles for select to authenticated using (true);
create policy "v1629 profiles insert" on public.profiles for insert to authenticated
  with check (id = auth.uid() and coalesce(role,'USER') = 'USER');
create policy "v1629 profiles update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_content_moderator())
  with check (id = auth.uid() or public.is_content_moderator());
create policy "v1629 profiles delete" on public.profiles for delete to authenticated
  using (public.is_content_moderator());

-- Prevent privilege escalation through self-profile editing.
create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and not public.is_content_moderator() then
    if new.role is distinct from old.role then
      raise exception 'Role modification is not allowed';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profile identity modification is not allowed';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_protect_profile_privileged_fields on public.profiles;
create trigger trg_protect_profile_privileged_fields before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

-- MESSAGES: strictly private to sender/recipient.
drop policy if exists "v1629 messages select" on public.messages;
drop policy if exists "v1629 messages insert" on public.messages;
drop policy if exists "v1629 messages update" on public.messages;
drop policy if exists "v1629 messages delete" on public.messages;
create policy "v1629 messages select" on public.messages for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "v1629 messages insert" on public.messages for insert to authenticated
  with check (sender_id = auth.uid());
create policy "v1629 messages update" on public.messages for update to authenticated
  using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy "v1629 messages delete" on public.messages for delete to authenticated
  using (sender_id = auth.uid());

-- NOTIFICATIONS: each user sees and manages only their own notifications.
drop policy if exists "notifications select" on public.notifications;
drop policy if exists "notifications insert" on public.notifications;
drop policy if exists "notifications update" on public.notifications;
drop policy if exists "notifications delete" on public.notifications;
drop policy if exists "v1629 notifications select" on public.notifications;
drop policy if exists "v1629 notifications update" on public.notifications;
drop policy if exists "v1629 notifications delete" on public.notifications;
create policy "v1629 notifications select" on public.notifications for select to authenticated
  using (user_id = auth.uid()::text);
create policy "v1629 notifications update" on public.notifications for update to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
create policy "v1629 notifications delete" on public.notifications for delete to authenticated
  using (user_id = auth.uid()::text);
-- Inserts are performed by SECURITY DEFINER notification functions / service role.

-- APP CONFIG: readable by signed-in users, writable only by content moderators.
drop policy if exists "v1629 app_config select" on public.app_config;
drop policy if exists "v1629 app_config update" on public.app_config;
create policy "v1629 app_config select" on public.app_config for select to authenticated using (true);
create policy "v1629 app_config update" on public.app_config for update to authenticated
  using (public.is_content_moderator()) with check (public.is_content_moderator());

-- SOCIAL CONTENT: signed-in visibility; author ownership for mutations, moderators override.
drop policy if exists "v1629 posts select" on public.posts;
drop policy if exists "v1629 posts insert" on public.posts;
drop policy if exists "v1629 posts update" on public.posts;
drop policy if exists "v1629 posts delete" on public.posts;
create policy "v1629 posts select" on public.posts for select to authenticated using (true);
create policy "v1629 posts insert" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "v1629 posts update" on public.posts for update to authenticated
  using (user_id = auth.uid() or public.is_content_moderator()) with check (user_id = auth.uid() or public.is_content_moderator());
create policy "v1629 posts delete" on public.posts for delete to authenticated
  using (user_id = auth.uid() or public.is_content_moderator());

drop policy if exists "v1629 comments select" on public.comments;
drop policy if exists "v1629 comments insert" on public.comments;
drop policy if exists "v1629 comments update" on public.comments;
drop policy if exists "v1629 comments delete" on public.comments;
create policy "v1629 comments select" on public.comments for select to authenticated using (true);
create policy "v1629 comments insert" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "v1629 comments update" on public.comments for update to authenticated
  using (user_id = auth.uid() or public.is_content_moderator()) with check (user_id = auth.uid() or public.is_content_moderator());
create policy "v1629 comments delete" on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_content_moderator());

-- MOODS: aggregate remains visible internally; users can only submit their own row.
drop policy if exists "v1629 moods select" on public.moods;
drop policy if exists "v1629 moods insert" on public.moods;
create policy "v1629 moods select" on public.moods for select to authenticated using (true);
create policy "v1629 moods insert" on public.moods for insert to authenticated with check (user_id = auth.uid());

-- REWARDS / TRANSACTIONS: remove anonymous access. Keep authenticated behavior for
-- compatibility with the existing client-side shop; a server-side atomic purchase RPC
-- is recommended as a post-hardening improvement.
drop policy if exists "v1629 rewards select" on public.rewards;
drop policy if exists "v1629 rewards write" on public.rewards;
create policy "v1629 rewards select" on public.rewards for select to authenticated using (true);
create policy "v1629 rewards write" on public.rewards for all to authenticated using (true) with check (true);

drop policy if exists "v1629 transactions select" on public.transactions;
drop policy if exists "v1629 transactions insert" on public.transactions;
create policy "v1629 transactions select" on public.transactions for select to authenticated
  using (user_id = auth.uid() or public.is_content_moderator());
create policy "v1629 transactions insert" on public.transactions for insert to authenticated
  with check (user_id = auth.uid() or public.is_content_moderator());

-- Ensure signed-in role has the table privileges expected by the policies.
do $$
declare t text;
begin
  foreach t in array array['profiles','posts','comments','messages','moods','rewards','transactions','app_config','notifications'] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    end if;
  end loop;
end $$;
