begin;
alter table public.events add column if not exists participation_mode text not null default 'open' check (participation_mode in ('open','info'));
create table if not exists public.newsletter_post_selection (
 post_id uuid primary key references public.posts(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.newsletter_post_selection enable row level security;
revoke all on public.newsletter_post_selection from public, anon, authenticated;
grant select, insert, delete on public.newsletter_post_selection to authenticated;
drop policy if exists editorial_admin on public.newsletter_post_selection;
create policy editorial_admin on public.newsletter_post_selection for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
create or replace function public.guard_info_event_attendees() returns trigger language plpgsql set search_path='' as $$
begin
 if new.participation_mode='info' and new.attendees is distinct from '[]'::jsonb then raise exception 'Cet événement ne permet pas les inscriptions'; end if;
 if tg_op='UPDATE' and new.participation_mode is distinct from old.participation_mode and current_user in ('authenticated','anon') and not public.is_content_moderator() then raise exception 'Modification interdite'; end if;
 return new;
end $$;
drop trigger if exists guard_info_event_attendees on public.events;
create trigger guard_info_event_attendees before insert or update on public.events for each row execute function public.guard_info_event_attendees();
notify pgrst, 'reload schema';
commit;
