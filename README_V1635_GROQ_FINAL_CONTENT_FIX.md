# V1.6.3.5 — Groq final content fix

Correctif ciblé sur la synthèse Groq GPT-OSS :
- remplace `max_tokens` par `max_completion_tokens` ;
- `reasoning_effort: low` pour éviter que le raisonnement consomme tout le budget de sortie ;
- `include_reasoning: false` pour demander uniquement la réponse finale ;
- instructions regroupées dans le message utilisateur ;
- lecture robuste de `message.content` ;
- correction du parseur des sections SUMMARY / KEY_POINTS / ACTIONS ;
- journalisation serveur utile si Groq renvoie malgré tout un contenu final vide.

Aucun SQL. Aucun changement des variables Vercel.
