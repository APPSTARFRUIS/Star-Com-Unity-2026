# Buildfix Parcours & Niveaux

Le commit GitHub précédent a été partiellement appliqué : `JeuxView.tsx` et une partie
d'`AdminPanel.tsx` étaient présents, mais `types.ts` n'avait pas reçu les nouveaux types.
Cela provoquait les erreurs TypeScript sur `learningPath`, `levelNumber`, `levelTitle`,
`passingScore` et `GameCompletion`.

Ce correctif :
- restaure les champs de progression dans `CompanyGame`;
- ajoute `GameCompletion`;
- rend la prop `completions` optionnelle dans `JeuxView`, avec `[]` par défaut,
  afin que le rendu `predictions` depuis `EngagementView` continue de compiler.

Aucune nouvelle migration SQL n'est ajoutée.
La migration `supabase/learning_paths_levels_migration.sql` du ZIP Parcours & Niveaux
reste celle à exécuter après un build Vercel réussi.
