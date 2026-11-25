begin;
create table if not exists public.notification_email_queue (
 notification_id uuid primary key, user_id text not null, kind text not null,
 created_at timestamptz not null default now(), status text not null default 'pending',
 claimed_at timestamptz, attempts integer not null default 0
);
alter table public.notification_email_queue enable row level security;
revoke all on public.notification_email_queue from public, anon, authenticated;
grant select, update on public.notification_email_queue to service_role;
create or replace function public.queue_notification_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.kind in ('newsletter','poll','highlight') and exists (
 select 1 from public.profiles p cross join public.app_config c
 where p.id::text=new.user_id and c.id=1 and c.notifications_test_mode is true
 and lower(trim(p.email))=lower(trim(c.notifications_test_email))
 and p.notification_settings->>'email'='true'
 and coalesce(p.notification_settings->>(case new.kind when 'newsletter' then 'newsletters' when 'poll' then 'polls' else 'highlights' end),'true')='true'
 ) then
 insert into public.notification_email_queue(notification_id,user_id,kind) values(new.id,new.user_id,new.kind) on conflict do nothing;
 end if;
 return new;
end; $$;
revoke all on function public.queue_notification_email() from public, anon, authenticated;
drop trigger if exists trg_queue_notification_email on public.notifications;
create trigger trg_queue_notification_email after insert on public.notifications for each row execute function public.queue_notification_email();
create or replace function public.claim_notification_emails() returns setof public.notification_email_queue
language sql security definer set search_path='' as $$
 update public.notification_email_queue q set status='sending',claimed_at=now(),attempts=q.attempts+1
 where q.notification_id in (select x.notification_id from public.notification_email_queue x where (x.status='pending' or (x.status='sending' and x.claimed_at < now()-interval '10 minutes')) and x.attempts<3 and x.created_at>now()-interval '24 hours' order by x.created_at limit 20 for update skip locked) returning q.*;
$$;
revoke all on function public.claim_notification_emails() from public, anon, authenticated;
grant execute on function public.claim_notification_emails() to service_role;
commit;
