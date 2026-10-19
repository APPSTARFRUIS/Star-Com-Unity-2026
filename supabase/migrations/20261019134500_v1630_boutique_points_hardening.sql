-- Star Com'Unity V1.6.30 — Boutique / points hardening
-- Idempotent. Existing test balances, stock and orders are preserved.

-- Rewards: everyone signed in can read; only ADMIN/MODERATEUR can manage catalogue/stock.
drop policy if exists "v1629 rewards write" on public.rewards;
drop policy if exists "v1630 rewards admin insert" on public.rewards;
drop policy if exists "v1630 rewards admin update" on public.rewards;
drop policy if exists "v1630 rewards admin delete" on public.rewards;
create policy "v1630 rewards admin insert" on public.rewards for insert to authenticated
  with check (public.is_content_moderator());
create policy "v1630 rewards admin update" on public.rewards for update to authenticated
  using (public.is_content_moderator()) with check (public.is_content_moderator());
create policy "v1630 rewards admin delete" on public.rewards for delete to authenticated
  using (public.is_content_moderator());

-- Transactions: history is readable by its owner (or moderation), but direct writes
-- are reserved to moderation. User spending/rewards go through controlled RPCs.
drop policy if exists "v1629 transactions insert" on public.transactions;
drop policy if exists "v1630 transactions admin insert" on public.transactions;
drop policy if exists "v1630 transactions admin update" on public.transactions;
drop policy if exists "v1630 transactions admin delete" on public.transactions;
create policy "v1630 transactions admin insert" on public.transactions for insert to authenticated
  with check (public.is_content_moderator());
create policy "v1630 transactions admin update" on public.transactions for update to authenticated
  using (public.is_content_moderator()) with check (public.is_content_moderator());
create policy "v1630 transactions admin delete" on public.transactions for delete to authenticated
  using (public.is_content_moderator());

-- A normal user must never be able to change their own point balance directly.
create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and not public.is_content_moderator() then
    if new.role is distinct from old.role then
      raise exception 'Role modification is not allowed';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profile identity modification is not allowed';
    end if;
    if new.points is distinct from old.points then
      raise exception 'Direct point balance modification is not allowed';
    end if;
  end if;
  return new;
end; $$;

-- Atomic shop purchase: locks both profile and reward, checks balance/stock,
-- debits points, decrements stock and records the order in one transaction.
create or replace function public.claim_shop_reward(p_reward_id uuid)
returns table(transaction_id uuid, remaining_points integer, remaining_stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_points integer;
  v_tx uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_reward from public.rewards where id = p_reward_id for update;
  if not found then raise exception 'Reward not found'; end if;
  if coalesce(v_reward.stock, 0) <= 0 then raise exception 'Reward out of stock'; end if;
  if coalesce(v_reward.cost, 0) < 0 then raise exception 'Invalid reward cost'; end if;

  select coalesce(points, 0) into v_points from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_points < v_reward.cost then raise exception 'Insufficient points'; end if;

  update public.profiles set points = v_points - v_reward.cost where id = v_user;
  update public.rewards set stock = stock - 1 where id = p_reward_id;

  insert into public.transactions(user_id, amount, reason, type, date)
  values (v_user, v_reward.cost, 'Achat : ' || v_reward.title, 'spend', now()::text)
  returning id into v_tx;

  return query select v_tx, v_points - v_reward.cost, v_reward.stock - 1;
end; $$;
revoke all on function public.claim_shop_reward(uuid) from public, anon;
grant execute on function public.claim_shop_reward(uuid) to authenticated;

-- Controlled generic spend for signed-in user (used by paid engagement actions).
-- The caller supplies the amount/reason, but can only debit their own balance;
-- no credit is possible through this RPC.
create or replace function public.spend_own_points(p_amount integer, p_reason text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_points integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if;
  if p_amount > 100000 then raise exception 'Amount too large'; end if;

  select coalesce(points,0) into v_points from public.profiles where id=v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_points < p_amount then raise exception 'Insufficient points'; end if;

  update public.profiles set points=v_points-p_amount where id=v_user;
  insert into public.transactions(user_id,amount,reason,type,date)
  values(v_user,p_amount,left(coalesce(nullif(trim(p_reason),''),'Utilisation de points'),500),'spend',now()::text);
  return v_points-p_amount;
end; $$;
revoke all on function public.spend_own_points(integer,text) from public, anon;
grant execute on function public.spend_own_points(integer,text) to authenticated;
