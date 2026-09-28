# V1.4.5 — Organigramme PDF pagination fix

Base: V1.4.4 PDF / Messages / Ranking.

Corrections:
- organigramme PDF paginé en vraies pages, sans cartes collaborateurs coupées entre deux pages ;
- tous les collaborateurs d'un service sont affichés (plus de `slice(0, 1)` / `+ X autres`) ;
- un service trop fourni est poursuivi proprement sur une page suivante avec mention `suite` ;
- maximum 3 blocs de service par page pour conserver une mise en page stable ;
- liens de la vue générale recalculés vers la première page réelle de chaque structure ;
- liens des fiches collaborateurs recalculés malgré la pagination variable ;
- bouton `RETOUR VUE GENERALE` conservé sur chaque page structure ;
- ouverture PDF demandée en mode page unique / pleine largeur sans l'option `UseNone` incompatible avec le typage jsPDF.

Les corrections V1.4.4 sont conservées : PDF newsletter, dates des messages, suppression appels/visio inactifs, suppression onglet classement « Ce mois ».
