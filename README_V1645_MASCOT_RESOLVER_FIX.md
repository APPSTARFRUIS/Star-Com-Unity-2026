# V1.6.45 — Ma Poire : resolver univers admin

- Corrige le resolver d'univers admin : SECURITY DEFINER pour éviter que les RLS de profiles/mascot_experiences bloquent silencieusement la résolution.
- Le resolver serveur devient autoritaire ; le fallback client n'est utilisé qu'en secours.
- Décor et humeur proviennent de la même ligne d'univers, donc sont appliqués ensemble.
- Ne modifie pas les décors personnels ni le dressing.

Migration à exécuter : `supabase/migrations/20261022132500_v1645_mascot_experience_resolver.sql`.
