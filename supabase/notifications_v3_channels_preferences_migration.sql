-- Star Com'Unity — Notifications V3
-- Ajoute les préférences Documents / Idées / Jeux et les applique aux notifications d'audience.
-- Réexécutable, sans suppression de données.

update public.profiles
set notification_settings =
  jsonb_build_object('documents', true, 'ideas', true, 'games', true)
  || coalesce(notification_settings, '{}'::jsonb);

create or replace function public.notify_new_document()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'document', 'Nouveau document', new.name,
    'documents', new.id::text, new.uploaded_by,
    new.audience_companies, 'documents'
  );
  return new;
end;
$$;

create or replace function public.notify_new_idea()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_audience_profiles_with_preferences(
    'idea', 'Nouvelle idée', new.title,
    'idees', new.id::text, new.user_id,
    new.audience_companies, 'ideas'
  );
  return new;
end;
$$;

-- Les triggers document/idée existent déjà dans Audiences centralisées V1.
-- On les recrée pour garantir l'installation V3 quelle que soit la séquence des migrations.
drop trigger if exists trg_notify_new_document on public.documents;
create trigger trg_notify_new_document after insert on public.documents
for each row execute function public.notify_new_document();

drop trigger if exists trg_notify_new_idea on public.ideas;
create trigger trg_notify_new_idea after insert on public.ideas
for each row execute function public.notify_new_idea();
