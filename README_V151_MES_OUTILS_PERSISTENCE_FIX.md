# Star Com'Unity V1.5.1 — correctif persistance Mes outils

- Les changements d'audience sont désormais édités localement puis enregistrés explicitement en une seule opération.
- Ajout d'un bouton « Enregistrer les modifications » afin d'éviter les courses entre plusieurs sauvegardes asynchrones.
- Ajout/modification/suppression attendent la confirmation Supabase avant de valider l'état local.
- Les erreurs Supabase ne sont plus ignorées : elles sont affichées et remontées au composant d'administration.
- L'ajout d'une nouvelle tuile est conservé uniquement après confirmation de la base.

Prérequis : la migration `supabase/migrations/20260930103000_add_external_tools_to_app_config.sql` doit avoir été appliquée à la base Supabase utilisée par l'application.
