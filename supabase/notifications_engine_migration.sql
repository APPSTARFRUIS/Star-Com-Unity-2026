
-- Star Com'Unity — moteur de notifications
-- Script réexécutable. Il crée la table et les triggers automatiques.

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  kind text not null default 'system',
  title text not null,
  message text not null,
  link_view text,
  entity_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications select" on public.notifications;
create policy "notifications select"
  on public.notifications for select using (true);

drop policy if exists "notifications insert" on public.notifications;
create policy "notifications insert"
  on public.notifications for insert with check (true);

drop policy if exists "notifications update" on public.notifications;
create policy "notifications update"
  on public.notifications for update using (true) with check (true);

drop policy if exists "notifications delete" on public.notifications;
create policy "notifications delete"
  on public.notifications for delete using (true);

-- Ajoute une notification à tous les profils, avec possibilité d'exclure l'auteur.
create or replace function public.notify_all_profiles(
  p_kind text,
  p_title text,
  p_message text,
  p_link_view text default null,
  p_entity_id text default null,
  p_excluded_user_id text default null
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
  where p_excluded_user_id is null or p.id::text <> p_excluded_user_id;
$$;

-- Publication sur le mur social.
create or replace function public.notify_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_profiles(
    'post',
    'Nouveau post',
    coalesce(new.user_name, 'Un collaborateur') || ' a publié sur le mur social.',
    'social',
    new.id::text,
    new.user_id::text
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_post on public.posts;
create trigger trg_notify_new_post
after insert on public.posts
for each row execute function public.notify_new_post();

-- Nouveau message : uniquement le destinataire.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
begin
  select name into v_sender_name
  from public.profiles
  where id::text = new.sender_id::text
  limit 1;

  insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
  values (
    new.receiver_id::text,
    'message',
    'Nouveau message',
    coalesce(v_sender_name, 'Un collaborateur') || ' vous a envoyé un message.',
    'messages',
    new.id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
after insert on public.messages
for each row execute function public.notify_new_message();

-- Nouvel événement.
create or replace function public.notify_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_profiles(
    'event',
    'Nouvel événement',
    new.title,
    'evenements',
    new.id::text,
    new.created_by::text
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_event on public.events;
create trigger trg_notify_new_event
after insert on public.events
for each row execute function public.notify_new_event();

-- Nouveau sondage.
create or replace function public.notify_new_poll()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_profiles(
    'poll',
    'Nouveau sondage',
    new.title,
    'sondages',
    new.id::text,
    new.created_by::text
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_poll on public.polls;
create trigger trg_notify_new_poll
after insert on public.polls
for each row execute function public.notify_new_poll();

-- Nouvelle newsletter.
create or replace function public.notify_new_newsletter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_profiles(
    'newsletter',
    'Nouvelle newsletter',
    new.title,
    'newsletter',
    new.id::text,
    null
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_newsletter on public.newsletters;
create trigger trg_notify_new_newsletter
after insert on public.newsletters
for each row execute function public.notify_new_newsletter();

-- Nouvelle célébration.
create or replace function public.notify_new_celebration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_profiles(
    'celebration',
    case when lower(coalesce(new.type, '')) in ('anniversary', 'birthday', 'anniversaire')
      then 'Nouvel anniversaire'
      else 'Nouvelle célébration'
    end,
    new.title,
    'celebrations',
    new.id::text,
    new.created_by::text
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_celebration on public.celebrations;
create trigger trg_notify_new_celebration
after insert on public.celebrations
for each row execute function public.notify_new_celebration();

-- Nouvelle animation / temps fort.
create or replace function public.notify_new_engagement_animation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_profiles(
    'highlight',
    'Nouveau temps fort',
    new.title,
    'tempsforts',
    new.id::text,
    new.created_by::text
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_engagement_animation on public.engagement_animations;
create trigger trg_notify_new_engagement_animation
after insert on public.engagement_animations
for each row execute function public.notify_new_engagement_animation();

-- Mouvement de points : notification ciblée.
create or replace function public.notify_points_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.amount, 0) > 0 and coalesce(new.type, '') = 'earn' then
    insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
    values (
      new.user_id::text,
      'points',
      'Points gagnés',
      '+' || new.amount::text || ' points · ' || coalesce(new.reason, 'Récompense'),
      'engagement',
      new.id::text
    );
  elsif coalesce(new.amount, 0) > 0 and coalesce(new.type, '') = 'spend' then
    insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
    values (
      new.user_id::text,
      'points',
      'Points utilisés',
      '-' || new.amount::text || ' points · ' || coalesce(new.reason, 'Achat'),
      'boutique',
      new.id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_points_transaction on public.transactions;
create trigger trg_notify_points_transaction
after insert on public.transactions
for each row execute function public.notify_points_transaction();

-- Activation Realtime, sans erreur si la table est déjà publiée.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
