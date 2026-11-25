begin;
alter table public.comments add column if not exists edited_at timestamptz;
alter table public.comments add column if not exists reactions jsonb not null default '{}'::jsonb;
-- Keep other employees' replies when a parent is deleted.
do $$ declare r record; begin
for r in select conname from pg_constraint where conrelid='public.comments'::regclass and contype='f' and conkey=array[(select attnum from pg_attribute where attrelid='public.comments'::regclass and attname='parent_id')] loop
execute format('alter table public.comments drop constraint %I',r.conname); end loop; end $$;
alter table public.comments add constraint comments_parent_id_fkey foreign key(parent_id) references public.comments(id) on delete set null;
alter table public.comments enable row level security;
drop policy if exists social_comment_update_guard on public.comments;
create policy social_comment_update_guard on public.comments as restrictive for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists social_comment_delete_guard on public.comments;
create policy social_comment_delete_guard on public.comments as restrictive for delete to authenticated using(user_id=auth.uid() or public.is_content_moderator());
-- Restrict direct edits of reaction data and identity; the RPC owns reactions.
create or replace function public.guard_social_comment_update() returns trigger language plpgsql set search_path=public as $$
begin
if current_user in ('authenticated','anon') then
 if new.user_id is distinct from old.user_id or new.post_id is distinct from old.post_id or new.idea_id is distinct from old.idea_id or new.parent_id is distinct from old.parent_id or new.reactions is distinct from old.reactions then raise exception 'Modification interdite'; end if;
end if; return new; end $$;
drop trigger if exists guard_social_comment_update on public.comments;
create trigger guard_social_comment_update before update on public.comments for each row execute function public.guard_social_comment_update();
create or replace function public.notify_social_comment(p_recipient uuid,p_post uuid,p_title text,p_message text) returns void language plpgsql security definer set search_path=public as $$
begin
if p_recipient is null or p_recipient=auth.uid() then return; end if;
insert into public.notifications(user_id,kind,title,message,link_view,entity_id)
select p.id,'post',p_title,p_message,'social',p_post::text from public.profiles p where p.id=p_recipient and public.notification_enabled(p.notification_settings,'posts');
end $$;
revoke all on function public.notify_social_comment(uuid,uuid,text,text) from public,authenticated,anon;
create or replace function public.toggle_social_comment_reaction(p_comment_id uuid,p_reaction text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); c public.comments%rowtype; result jsonb; k text; had boolean; previous boolean; audience text[];
begin
if uid is null or p_reaction is null or p_reaction not in ('👍','❤️','👏','😂','💡') then raise exception 'Réaction interdite'; end if;
select * into c from public.comments where id=p_comment_id and post_id is not null for update;
if not found then raise exception 'Commentaire introuvable'; end if;
select audience_companies into audience from public.posts where id=c.post_id;
if coalesce(cardinality(audience),0)>0 and not exists(select 1 from public.profiles p where p.id=uid and p.company::text=any(audience)) then raise exception 'Accès interdit'; end if;
result:=coalesce(c.reactions,'{}'::jsonb); had:=coalesce(result->p_reaction,'[]'::jsonb)?uid::text;
previous:=exists(select 1 from jsonb_each(result) e where e.value ? uid::text);
foreach k in array array['👍','❤️','👏','😂','💡'] loop
result:=jsonb_set(result,array[k],(select coalesce(jsonb_agg(v),'[]'::jsonb) from jsonb_array_elements(coalesce(result->k,'[]'::jsonb)) v where v #>> '{}' <> uid::text),true);
end loop;
if not had then result:=jsonb_set(result,array[p_reaction],coalesce(result->p_reaction,'[]'::jsonb)||to_jsonb(uid::text),true); end if;
update public.comments set reactions=result where id=c.id;
if not had and not previous then perform public.notify_social_comment(c.user_id,c.post_id,'Réaction à votre commentaire','Un collègue a réagi à votre commentaire.'); end if;
return result; end $$;
revoke all on function public.toggle_social_comment_reaction(uuid,text) from public,anon;
grant execute on function public.toggle_social_comment_reaction(uuid,text) to authenticated;
create or replace function public.social_comment_reply_notice() returns trigger language plpgsql security definer set search_path=public as $$
declare parent public.comments%rowtype;
begin
if new.post_id is not null and new.parent_id is not null then
select * into parent from public.comments where id=new.parent_id;
if not found or parent.post_id is distinct from new.post_id then raise exception 'Réponse invalide'; end if;
if true then
perform public.notify_social_comment(parent.user_id,new.post_id,'Réponse à votre commentaire',new.user_name||' a répondu à votre commentaire.'); end if;
end if; return new; end $$;
drop trigger if exists social_comment_reply_notice on public.comments;
create trigger social_comment_reply_notice after insert on public.comments for each row execute function public.social_comment_reply_notice();
commit;
