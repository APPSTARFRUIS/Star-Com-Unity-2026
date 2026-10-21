# V1.6.34 — Ma Poire : positionnement des accessoires

Corrige le comportement V1.6.33 où l'image d'un accessoire était superposée sur toute la zone de la mascotte.

## Nouveau
- chaque accessoire possède position X/Y, taille et rotation ;
- l'administration affiche un aperçu en direct sur la poire ;
- bouton « Régler » pour corriger un accessoire déjà créé ;
- pour la catégorie Chaussures, option « Dupliquer pour former une paire » avec réglage de l'écart ;
- les mêmes réglages sont utilisés dans Mon espace lorsque l'objet est équipé.

## Migration
Exécuter : `supabase/migrations/20261021145500_v1634_mascot_layer_positioning.sql`

Les chaussures déjà créées reçoivent automatiquement un positionnement de départ en bas de la mascotte. Utiliser Administration > Mascotte > Accessoires > Régler pour affiner le résultat.
