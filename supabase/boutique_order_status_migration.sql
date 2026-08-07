-- Star Com'Unity — statut des commandes Boutique
-- À exécuter une fois dans Supabase > SQL Editor.

alter table public.transactions
  add column if not exists order_status text not null default 'pending';

alter table public.transactions
  add column if not exists distributed_at timestamptz null;

alter table public.transactions
  drop constraint if exists transactions_order_status_check;

alter table public.transactions
  add constraint transactions_order_status_check
  check (order_status in ('pending', 'distributed'));

-- Les anciennes vraies commandes Boutique deviennent "en attente".
update public.transactions
set order_status = 'pending'
where type = 'spend'
  and reason ilike 'Achat :%'
  and order_status is distinct from 'distributed';
