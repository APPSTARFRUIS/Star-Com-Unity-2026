-- Star Com'Unity — Notifications V4 / consolidation triggers
-- Correctif de la signature notify_audience_profiles_with_preferences
-- + consolidation des triggers de notifications.
--
-- Réexécutable. Ne supprime aucune donnée métier.

begin;

-- ---------------------------------------------------------------------------
-- 1. Préférences : garantit l'existence de toutes les clés utilisées
-- ---------------------------------------------------------------------------
update public.profiles
set notification_settings =
  jsonb_build_object(
    'inApp', true,
    'email', false,
    'desktop', false,
    'mobile', false,
    'posts', true,
    'events', true,
    'messages', true,
    'birthdays', true,
    'polls', true,
    'newsletters', true,
    'celebrations', true,
    'highlights', true,
    'points', true,
    'documents', true,
    'ideas', true,
    'games', true
  )
  || coalesce(notification_settings, '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 2. Helper commun : préférences internes
-- ---------------------------------------------------------------------------
create or replace function public.notification_enabled(
  p_settings jsonb,
  p_preference_key text
)
returns boolean
language sql
immutable
as $$
  select
    coalesce((p_settings->>'inApp')::boolean, true)
    and
    case
      when p_preference_key is null then true
      else coalesce((p_settings->>p_preference_key)::boolean, true)
    end;
$$;

-- Helper global, signature TEXTE pour accepter indifféremment UUID/text après cast.
create or replace function public.notify_profiles_with_preferences(
  p_kind text,
  p_title text,
  p_message text,
  p_link_view text default null,
  p_entity_id text default null,
  p_excluded_user_id text default null,
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
    (p_excluded_user_id is null or p.id::text <> p_excluded_user_id)
    and public.notification_enabled(p.notification_settings, p_preference_key);
$$;

-- ---------------------------------------------------------------------------
-- 3. Helper audience : LE correctif du bug sondages
-- ---------------------------------------------------------------------------
-- Supprime l'ancienne surcharge UUID qui provoquait les erreurs de résolution
-- lorsque polls.created_by (TEXT) était passé au helper.
drop function if exists public.notify_audience_profiles_with_preferences(
  text, text, text, text, text, uuid, text[], text
);

create or replace function public.notify_audience_profiles_with_preferences(
  p_kind text,
  p_title text,
  p_message text,
  p_link_view text,
  p_entity_id text,
  p_excluded_user_id text,
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
    (p_excluded_user_id is null or p.id::text <> p_excluded_user_id)
    and public.notification_enabled(p.notification_settings, p_preference_key)
    and (
      -- Contenu commun à tous
      'ALL' = any(coalesce(p_audience, array[]::text[]))
      or 'TOUS' = any(
        array(
          select upper(trim(x))
          from unnest(coalesce(p_audience, array[]::text[])) x
        )
      )
      -- Contenu ciblé sur l'entreprise du profil
      or exists (
        select 1
        from unnest(coalesce(p_audience, array[]::text[])) company_name
        where lower(trim(company_name)) = lower(trim(coalesce(p.company, '')))
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- 4. Triggers audience : Events / Polls / Documents / Ideas
-- Tous les IDs exclus sont CASTÉS explicitement en text.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'event',
    'Nouvel événement',
    new.title,
    'evenements',
    new.id::text,
    new.created_by::text,
    coalesce(new.audience_companies, array['ALL']::text[]),
    'events'
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
    'poll',
    'Nouveau sondage',
    new.title,
    'sondages',
    new.id::text,
    new.created_by::text,
    coalesce(new.audience_companies, array['ALL']::text[]),
    'polls'
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
    'document',
    'Nouveau document',
    new.name,
    'documents',
    new.id::text,
    new.uploaded_by::text,
    coalesce(new.audience_companies, array['ALL']::text[]),
    'documents'
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
    'idea',
    'Nouvelle idée',
    new.title,
    'idees',
    new.id::text,
    new.user_id::text,
    coalesce(new.audience_companies, array['ALL']::text[]),
    'ideas'
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

-- ---------------------------------------------------------------------------
-- 5. Jeu / e-learning : notification globale, auteur exclu
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_game()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- On notifie uniquement lorsqu'un jeu est effectivement actif/publiable.
  if lower(coalesce(new.status, 'actif')) in ('actif', 'active', 'published', 'publié', 'publie') then
    perform public.notify_profiles_with_preferences(
      'game',
      'Nouveau jeu / e-learning',
      new.title,
      'jeux',
      new.id::text,
      new.created_by::text,
      'games'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_game on public.games;
create trigger trg_notify_new_game
after insert on public.games
for each row execute function public.notify_new_game();

-- ---------------------------------------------------------------------------
-- 6. Repose explicitement les triggers V2 globaux pour éviter les migrations
-- historiques incohérentes.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_profiles_with_preferences(
    'post',
    'Nouveau post',
    coalesce(new.user_name, 'Un collaborateur') || ' a publié sur le mur social.',
    'social',
    new.id::text,
    new.user_id::text,
    'posts'
  );
  return new;
end;
$$;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
  v_settings jsonb;
begin
  select name into v_sender_name
  from public.profiles
  where id::text = new.sender_id::text
  limit 1;

  select notification_settings into v_settings
  from public.profiles
  where id::text = new.receiver_id::text
  limit 1;

  if public.notification_enabled(v_settings, 'messages') then
    insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
    values (
      new.receiver_id::text,
      'message',
      'Nouveau message',
      coalesce(v_sender_name, 'Un collaborateur') || ' vous a envoyé un message.',
      'messages',
      new.id::text
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_new_newsletter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_profiles_with_preferences(
    'newsletter',
    'Nouvelle newsletter',
    new.title,
    'newsletter',
    new.id::text,
    null,
    'newsletters'
  );
  return new;
end;
$$;

create or replace function public.notify_new_celebration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preference text;
begin
  v_preference :=
    case
      when lower(coalesce(new.type, '')) in ('anniversary', 'birthday', 'anniversaire')
        then 'birthdays'
      else 'celebrations'
    end;

  perform public.notify_profiles_with_preferences(
    'celebration',
    case when v_preference = 'birthdays'
      then 'Nouvel anniversaire'
      else 'Nouvelle célébration'
    end,
    new.title,
    'celebrations',
    new.id::text,
    new.created_by::text,
    v_preference
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_post on public.posts;
create trigger trg_notify_new_post
after insert on public.posts
for each row execute function public.notify_new_post();

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
after insert on public.messages
for each row execute function public.notify_new_message();

drop trigger if exists trg_notify_new_newsletter on public.newsletters;
create trigger trg_notify_new_newsletter
after insert on public.newsletters
for each row execute function public.notify_new_newsletter();

drop trigger if exists trg_notify_new_celebration on public.celebrations;
create trigger trg_notify_new_celebration
after insert on public.celebrations
for each row execute function public.notify_new_celebration();

-- Force le cache PostgREST à relire le schéma/fonctions.
notify pgrst, 'reload schema';

commit;
