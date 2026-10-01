# V1.6.3.1 — Correctif modèle Groq

- Remplace le modèle `llama-3.1-8b-instant`, retiré des offres Free/Developer Groq le 16/08/2026.
- Modèle de production par défaut : `openai/gpt-oss-20b`.
- La fonction interroge aussi `/openai/v1/models` avec la clé serveur et choisit automatiquement un modèle disponible parmi :
  1. `GROQ_DOCUMENT_MODEL` si configuré et disponible ;
  2. `openai/gpt-oss-20b` ;
  3. `openai/gpt-oss-120b` ;
  4. `qwen/qwen3.8-27b`.
- Aucun SQL supplémentaire.
- `GROQ_API_KEY` reste uniquement côté serveur Vercel.
