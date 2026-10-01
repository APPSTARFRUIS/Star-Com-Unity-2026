-- V1.5.7 - Une carte par anniversaire + souhaits/commentaires + coeurs
create table if not exists public.birthday_wishes (
  id uuid primary key default gen_random_uuid(),
  birthday_user_id uuid not null,
  author_id uuid not null,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.birthday_likes (
  id uuid primary key default gen_random_uuid(),
  birthday_user_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (birthday_user_id, user_id)
);

alter table public.birthday_wishes enable row level security;
alter table public.birthday_likes enable row level security;

drop policy if exists "birthday_wishes_select" on public.birthday_wishes;
drop policy if exists "birthday_wishes_insert" on public.birthday_wishes;
drop policy if exists "birthday_likes_select" on public.birthday_likes;
drop policy if exists "birthday_likes_insert" on public.birthday_likes;
drop policy if exists "birthday_likes_delete" on public.birthday_likes;

create policy "birthday_wishes_select" on public.birthday_wishes for select to authenticated using (true);
create policy "birthday_wishes_insert" on public.birthday_wishes for insert to authenticated with check (author_id = auth.uid());
create policy "birthday_likes_select" on public.birthday_likes for select to authenticated using (true);
create policy "birthday_likes_insert" on public.birthday_likes for insert to authenticated with check (user_id = auth.uid());
create policy "birthday_likes_delete" on public.birthday_likes for delete to authenticated using (user_id = auth.uid());

grant select, insert on public.birthday_wishes to authenticated;
grant select, insert, delete on public.birthday_likes to authenticated;

create index if not exists idx_birthday_wishes_user on public.birthday_wishes(birthday_user_id, created_at);
create index if not exists idx_birthday_likes_user on public.birthday_likes(birthday_user_id);
