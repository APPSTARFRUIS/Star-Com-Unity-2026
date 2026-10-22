# V1.6.42 — Univers & Humeurs HARD FIX

Correctif du rendu utilisateur des univers de Ma Poire.

- Le decor_image_url est passe directement a MascotCanvas via backgroundUrl.
- MascotCanvas applique le decor comme background-image CSS du canvas.
- Fallback local sur mascot_experiences si get_active_mascot_experience ne retourne rien.
- L'humeur de l'univers est restauree apres les animations temporaires au lieu de revenir systematiquement a idle.
- Apercu Admin utilise exactement le meme mecanisme backgroundUrl que le rendu utilisateur.

Aucun nouveau SQL si 20261022104500_v1642_active_universe_rpc.sql a deja ete execute.
