# Star ComUnity V1.3.3 — Safari loading fix

## Diagnostic
Le même iPhone affiche correctement les profils via Chrome/Google mais pas via Safari.
La base et les profils sont donc valides. Le problème venait du pipeline de chargement :
certaines requêtes pouvaient attendre trop longtemps et bloquer la vue Équipe.

## Modifications
- timeout explicite sur les appels Supabase critiques ;
- profils essentiels chargés AVANT les champs enrichis ;
- enrichissement métier/anecdote lancé ensuite sans bloquer l'annuaire ;
- 4 tentatives avec délai progressif ;
- cache conservé uniquement comme secours, jamais comme condition de réussite ;
- structures/services/contacts avec timeout individuel ;
- une table secondaire lente ne bloque plus toutes les autres ;
- statistiques gamification chargées en arrière-plan ;
- TeamView se resynchronise quand les vraies structures arrivent après les profils ;
- les fallbacks company/department de la V1.3.2 restent actifs.

## SQL
Aucune migration SQL nécessaire.
