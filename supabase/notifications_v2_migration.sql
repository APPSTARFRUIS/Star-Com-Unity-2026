-- Star Com'Unity — Notifications V2
-- Rend les préférences utilisateur réellement effectives.
-- Script réexécutable. Aucune donnée existante n'est supprimée.

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

create or replace function public.notify_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_profiles_with_preferences(
    'post', 'Nouveau post',
    coalesce(new.user_name, 'Un collaborateur') || ' a publié sur le mur social.',
    'social', new.id::text, new.user_id::text, 'posts'
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
      new.receiver_id::text, 'message', 'Nouveau message',
      coalesce(v_sender_name, 'Un collaborateur') || ' vous a envoyé un message.',
      'messages', new.id::text
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_profiles_with_preferences(
    'event', 'Nouvel événement', new.title,
    'evenements', new.id::text, new.created_by::text, 'events'
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
  perform public.notify_profiles_with_preferences(
    'poll', 'Nouveau sondage', new.title,
    'sondages', new.id::text, new.created_by::text, 'polls'
  );
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
    'newsletter', 'Nouvelle newsletter', new.title,
    'newsletter', new.id::text, null, 'newsletters'
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
    case when v_preference = 'birthdays' then 'Nouvel anniversaire' else 'Nouvelle célébration' end,
    new.title,
    'celebrations',
    new.id::text,
    new.created_by::text,
    v_preference
  );

  return new;
end;
$$;

create or replace function public.notify_new_engagement_animation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_profiles_with_preferences(
    'highlight', 'Nouveau temps fort', new.title,
    'tempsforts', new.id::text, new.created_by::text, 'highlights'
  );
  return new;
end;
$$;

create or replace function public.notify_points_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings jsonb;
begin
  select notification_settings into v_settings
  from public.profiles
  where id::text = new.user_id::text
  limit 1;

  if not public.notification_enabled(v_settings, 'points') then
    return new;
  end if;

  if coalesce(new.amount, 0) > 0 and coalesce(new.type, '') = 'earn' then
    insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
    values (
      new.user_id::text, 'points', 'Points gagnés',
      '+' || new.amount::text || ' points · ' || coalesce(new.reason, 'Récompense'),
      'engagement', new.id::text
    );
  elsif coalesce(new.amount, 0) > 0 and coalesce(new.type, '') = 'spend' then
    insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
    values (
      new.user_id::text, 'points', 'Points utilisés',
      '-' || new.amount::text || ' points · ' || coalesce(new.reason, 'Achat'),
      'boutique', new.id::text
    );
  end if;

  return new;
end;
$$;

update public.profiles
set notification_settings =
  jsonb_build_object(
    'inApp', true,
    'email', true,
    'desktop', true,
    'mobile', true,
    'posts', true,
    'events', true,
    'messages', true,
    'birthdays', true,
    'polls', true,
    'newsletters', true,
    'celebrations', true,
    'highlights', true,
    'points', true
  )
  || coalesce(notification_settings, '{}'::jsonb);
