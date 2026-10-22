-- Star Com'Unity - Social V2
-- Extension non destructive : les publications et commentaires existants restent compatibles.

alter table public.posts add column if not exists post_type text not null default 'publication';
alter table public.posts add column if not exists reactions jsonb not null default '{}'::jsonb;
alter table public.posts add column if not exists poll_options jsonb not null default '[]'::jsonb;
alter table public.posts add column if not exists poll_votes jsonb not null default '{}'::jsonb;
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists link_url text;
alter table public.posts add column if not exists audience_companies text[] not null default '{}'::text[];
alter table public.posts add column if not exists mentioned_user_ids uuid[] not null default '{}'::uuid[];
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists reactions jsonb not null default '{}'::jsonb;

create index if not exists idx_posts_social_v2_created on public.posts (is_pinned desc, created_at desc);
create index if not exists idx_comments_parent_id on public.comments(parent_id);

-- Normalise les anciens posts pour le nouveau client.
update public.posts set post_type='publication' where post_type is null or post_type='';
