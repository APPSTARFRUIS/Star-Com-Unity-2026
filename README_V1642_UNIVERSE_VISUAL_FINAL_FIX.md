# V1.6.42 — Univers / humeurs — correctif visuel final

Correctifs :
- Lorsqu'un univers possède un décor, Hermione est réduite/recentrée afin que le décor soit réellement visible autour d'elle.
- Le décor est rendu sur toute la surface du canvas, sous Hermione et ses accessoires.
- Les humeurs ont maintenant un signe visuel explicite :
  - Heureuse : coeurs + rebond
  - Festive : étoiles/confettis + célébration
  - Fière : étoiles + posture
  - Curieuse : point d'interrogation + inclinaison
  - Somnolente : Zzz + mouvement lent
  - Calme : animation de repos
- Même rendu dans l'aperçu Admin et chez l'utilisateur.

Aucune nouvelle migration SQL n'est nécessaire si `20261022104500_v1642_active_universe_rpc.sql` a déjà été exécutée.
