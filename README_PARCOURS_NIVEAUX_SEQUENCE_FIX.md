# Correctif séquence Parcours / Niveaux

- Tous les nouveaux jeux sont rattachés par défaut à `Parcours Star ComUnity`.
- Le même nom de parcours doit être utilisé pour les niveaux 1, 2, 3, 4...
- Niveau N exige strictement Niveau N-1.
- Si le niveau précédent n’existe pas, le niveau suivant reste verrouillé.
- Le contrôle est fait dans l’interface ET dans Supabase.
- Les cartes affichent maintenant clairement le parcours, le numéro de niveau et le thème.
- Les jeux sont triés par parcours puis par niveau.

IMPORTANT : les jeux déjà créés avec `learning_path` vide restent des jeux libres. Ils ne peuvent pas être devinés automatiquement. Pour les intégrer à la progression, il faut les recréer/paramétrer avec le même nom de parcours.

Après déploiement, exécuter `supabase/learning_paths_strict_sequence_patch.sql` dans le SQL Editor Supabase.
