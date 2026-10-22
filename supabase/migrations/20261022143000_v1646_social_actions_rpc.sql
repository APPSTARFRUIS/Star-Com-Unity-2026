-- V1.6.46 - Social V2 actions: secure reactions and poll votes without granting arbitrary post UPDATE.

create or replace function public.toggle_social_post_reaction(p_post_id uuid, p_reaction text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_reactions jsonb;
  current_users jsonb;
  next_users jsonb;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_reaction not in ('👍','❤️','👏','😂','💡') then raise exception 'Invalid reaction'; end if;

  select coalesce(reactions,'{}'::jsonb) into current_reactions
  from public.posts where id=p_post_id for update;
  if not found then raise exception 'Post not found'; end if;

  current_users := coalesce(current_reactions -> p_reaction, '[]'::jsonb);
  if current_users ? uid::text then
    select coalesce(jsonb_agg(value), '[]'::jsonb) into next_users
    from jsonb_array_elements(current_users) where value #>> '{}' <> uid::text;
  else
    next_users := current_users || to_jsonb(uid::text);
  end if;

  current_reactions := jsonb_set(current_reactions, array[p_reaction], next_users, true);
  update public.posts set reactions=current_reactions where id=p_post_id;
  return current_reactions;
end; $$;

create or replace function public.vote_social_poll(p_post_id uuid, p_option text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  opts jsonb;
  votes jsonb;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select coalesce(poll_options,'[]'::jsonb), coalesce(poll_votes,'{}'::jsonb)
    into opts, votes from public.posts where id=p_post_id and post_type='poll' for update;
  if not found then raise exception 'Poll not found'; end if;
  if not (opts ? p_option) then raise exception 'Invalid option'; end if;
  votes := jsonb_set(votes, array[uid::text], to_jsonb(p_option), true);
  update public.posts set poll_votes=votes where id=p_post_id;
  return votes;
end; $$;

revoke all on function public.toggle_social_post_reaction(uuid,text) from public;
revoke all on function public.vote_social_poll(uuid,text) from public;
grant execute on function public.toggle_social_post_reaction(uuid,text) to authenticated;
grant execute on function public.vote_social_poll(uuid,text) to authenticated;
