-- Star ComUnity — Multi-entreprises V1
-- À exécuter une fois après le déploiement.
alter table public.app_config add column if not exists companies text[] not null default array['Star Fruits','Star Export','Star PMP','AC Fruit','Eurostème'];
alter table public.documents add column if not exists audience_companies text[] not null default array['Star Fruits'];
alter table public.polls add column if not exists audience_companies text[] not null default array['Star Fruits'];
alter table public.events add column if not exists audience_companies text[] not null default array['Star Fruits'];
update public.documents set audience_companies=array['Star Fruits'] where audience_companies is null or cardinality(audience_companies)=0;
update public.polls set audience_companies=array['Star Fruits'] where audience_companies is null or cardinality(audience_companies)=0;
update public.events set audience_companies=array['Star Fruits'] where audience_companies is null or cardinality(audience_companies)=0;
-- Les jeux restent communs à tout Star Group.
