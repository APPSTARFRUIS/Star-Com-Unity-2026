# Star ComUnity V1.4.2 — Notifications triggers fix

## Bug corrigé
La création d'un sondage échouait avec :

`function public.notify_audience_profiles_with_preferences(unknown, unknown, text, unknown, text, text, text[], unknown) does not exist`

Cause : `polls.created_by` est de type **text**, alors que la fonction installée par une ancienne migration attendait un **uuid**. PostgreSQL ne trouvait donc aucune signature compatible au moment du trigger.

## Correctif
Migration unique de consolidation :
`supabase/notifications_v4_consolidation_trigger_fix.sql`

Elle :
- remplace le helper audience par une signature cohérente en `text`;
- caste explicitement tous les IDs d'auteur en `text`;
- recrée les triggers Event / Poll / Document / Idée;
- ajoute le trigger manquant Nouveau jeu / e-learning;
- consolide aussi Post / Message / Newsletter / Célébration;
- respecte les préférences utilisateur;
- exclut l'auteur de sa propre notification;
- conserve les audiences multi-entreprises;
- recharge le schema cache PostgREST.

## À faire après le push
Supabase > SQL Editor > New query :
copier tout le contenu de `supabase/notifications_v4_consolidation_trigger_fix.sql`, puis Run.

Aucune donnée métier n'est supprimée.
