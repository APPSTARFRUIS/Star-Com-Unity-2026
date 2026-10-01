-- Star Com'Unity V1.6.0 - Synthèses et recherche documentaire
-- Migration additive et idempotente : aucune donnée existante n'est supprimée.

alter table public.documents add column if not exists summary text;
alter table public.documents add column if not exists key_points jsonb not null default '[]'::jsonb;
alter table public.documents add column if not exists actions jsonb not null default '[]'::jsonb;
alter table public.documents add column if not exists extracted_text text;
alter table public.documents add column if not exists analyzed_at timestamptz;

comment on column public.documents.summary is 'Résumé généré à partir du contenu du document';
comment on column public.documents.key_points is 'Points clés extraits du document';
comment on column public.documents.actions is 'Actions, décisions et échéances explicitement détectées';
comment on column public.documents.extracted_text is 'Texte extrait pour la recherche interne';

-- V1.6.1 : migration autonome.
-- Certaines bases historiques n'ont pas encore la fonction ajoutée en V1.3.
-- On la crée/actualise ici à partir du système de rôles réellement utilisé par Star ComUnity.
create or replace function public.is_content_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('ADMIN', 'MODERATEUR')
  );
$$;

grant execute on function public.is_content_moderator() to authenticated;

-- L'analyse enrichit le document existant. Seul son auteur ou un ADMIN/MODERATEUR
-- peut enregistrer cette analyse.
drop policy if exists "documents_update_analysis" on public.documents;
create policy "documents_update_analysis"
on public.documents for update to authenticated
using (uploaded_by = auth.uid() or public.is_content_moderator())
with check (uploaded_by = auth.uid() or public.is_content_moderator());
