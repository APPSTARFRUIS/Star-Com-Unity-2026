-- V1.6.40 — phrases administrables de Ma Poire
create table if not exists public.mascot_phrases (
 id uuid primary key default gen_random_uuid(),
 context text not null default 'general' check (context in ('general','tap','new_item','reward','collection_complete','birthday')),
 text text not null,
 active boolean not null default true,
 weight integer not null default 10 check (weight between 1 and 100),
 created_at timestamptz not null default now()
);
alter table public.mascot_phrases enable row level security;
revoke all on table public.mascot_phrases from anon;
drop policy if exists "mascot_phrases_authenticated_read" on public.mascot_phrases;
create policy "mascot_phrases_authenticated_read" on public.mascot_phrases for select to authenticated using (active = true or public.is_content_moderator());
drop policy if exists "mascot_phrases_admin_manage" on public.mascot_phrases;
create policy "mascot_phrases_admin_manage" on public.mascot_phrases for all to authenticated using (public.is_content_moderator()) with check (public.is_content_moderator());
insert into public.mascot_phrases(context,text,weight)
select * from (values
 ('general','Aujourd’hui, je me sens particulièrement poire.',10),
 ('general','Je garde la forme. Enfin… la forme d’une poire.',10),
 ('tap','Hé ! Ça chatouille.',10),
 ('tap','Tu viens juste me voir ou tu avais quelque chose à me mettre ?',10),
 ('new_item','Pas mal mon nouveau look, non ?',10),
 ('reward','Ça, je l’ai mérité !',10),
 ('collection_complete','Collection complète. Je commence à avoir du style.',10)
) v(context,text,weight)
where not exists (select 1 from public.mascot_phrases);
