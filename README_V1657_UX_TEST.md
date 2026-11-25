# V1.6.57 — expérimentation UX
- Messagerie masquée via featureFlags.ts (MESSAGES_VISIBLE). Composants, tables et abonnements conservés. Les liens vers la messagerie redirigent vers l'accueil pendant le test.
- Accueil : synthèse des notifications récentes et non lues, cinq entrées maximum. Dernière ouverture mémorisée localement par utilisateur et navigateur ; pas de synchronisation entre appareils. Les notifications déjà purgées ne sont pas récupérables.
- Aucun changement aux composants de la mascotte, au service worker, aux réglages push ou aux migrations SQL. Le push reste dans son mode existant.
- Email : reste prévu, non raccordé à un prestataire. La centralisation multicanale et les actions en attente indépendantes des notifications restent à réaliser.
- Aucun SQL à exécuter pour cette étape.
- Recette : accueil sur mobile et ordinateur, navigation sans Messages, notifications non lues et réouverture, cloche, popup mascotte et push du compte test. Vérifier également dressing et points.
- Build non validé localement : dépendances npm indisponibles dans le cache hors ligne.
