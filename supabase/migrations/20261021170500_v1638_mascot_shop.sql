-- V1.6.38 — Boutique Ma Poire
-- Sécurise l'achat d'accessoires en tenant compte des collections et de leurs dates de disponibilité.
create or replace function public.claim_mascot_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_item public.mascot_items%rowtype;
  v_points integer;
  v_collection public.mascot_collections%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select * into v_item
  from public.mascot_items
  where id=p_item_id and active=true
  for update;

  if not found or v_item.acquisition_type<>'purchase' then
    raise exception 'Item unavailable';
  end if;

  if v_item.collection_id is not null then
    select * into v_collection
    from public.mascot_collections
    where id=v_item.collection_id;

    if not found or not v_collection.active
       or (v_collection.starts_at is not null and now() < v_collection.starts_at)
       or (v_collection.ends_at is not null and now() > v_collection.ends_at) then
      raise exception 'Item unavailable';
    end if;
  end if;

  if exists(select 1 from public.mascot_user_items where user_id=v_user and item_id=p_item_id) then
    raise exception 'Already owned';
  end if;

  select points into v_points from public.profiles where id=v_user for update;
  if coalesce(v_points,0)<v_item.price_points then raise exception 'Insufficient points'; end if;

  update public.profiles set points=points-v_item.price_points where id=v_user;
  insert into public.mascot_user_items(user_id,item_id,acquisition_method,equipped)
  values(v_user,p_item_id,'purchase',false);
  insert into public.transactions(user_id,amount,reason,date,type)
  values(v_user,-v_item.price_points,'Achat : Ma Poire - '||v_item.name,now(),'spend');

  return jsonb_build_object(
    'remaining_points',v_points-v_item.price_points,
    'item_id',p_item_id
  );
end$$;

revoke all on function public.claim_mascot_item(uuid) from public,anon;
grant execute on function public.claim_mascot_item(uuid) to authenticated;
