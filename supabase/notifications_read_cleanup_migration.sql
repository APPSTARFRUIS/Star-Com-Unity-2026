-- Star Com'Unity — nettoyage automatique des notifications
-- À exécuter une fois dans Supabase > SQL Editor.

alter table public.notifications
  add column if not exists read_at timestamptz null;

-- Pour les anciennes notifications déjà lues, on utilise leur date de création
-- comme point de départ afin qu'elles puissent elles aussi être nettoyées.
update public.notifications
set read_at = created_at
where is_read = true
  and read_at is null;

create index if not exists idx_notifications_read_cleanup
  on public.notifications(user_id, is_read, read_at);

-- Optionnel mais utile : fonction réutilisable côté base.
create or replace function public.purge_old_read_notifications(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.notifications
  where user_id = p_user_id
    and is_read = true
    and read_at < now() - interval '7 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
