# V1.6.46 — Social V2 actions + Hermione notifications

## Social
- Réactions sécurisées via `toggle_social_post_reaction` : tout utilisateur authentifié peut réagir sans obtenir un droit UPDATE général sur le post.
- Votes de sondage sécurisés via `vote_social_poll`.
- Mise à jour optimiste : clic immédiatement visible.
- Les erreurs RPC sont affichées au lieu d'échouer silencieusement.
- Le gras, l'italique et les liens insérés par le composeur sont maintenant réellement rendus.
- Upload local photo/GIF/document/vidéo conservé.

## Hermione mini-notification
- Hermione peut apparaître en bas à droite sur les pages de l'application lorsqu'une notification non lue existe.
- Elle utilise le nom personnel de la mascotte si disponible.
- Titre + message + bouton d'accès au module concerné.
- Fermeture pour la session sans marquer la notification comme lue.
- Pas d'affichage dans le Centre de notifications lui-même.

## Migration à exécuter
`supabase/migrations/20261022143000_v1646_social_actions_rpc.sql`
