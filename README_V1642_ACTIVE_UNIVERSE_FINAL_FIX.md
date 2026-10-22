# V1.6.42 — Active Universe FINAL FIX

- Resolves exactly one applicable universe in Supabase with `get_active_mascot_experience()`.
- Eliminates client-side ambiguity when several active universes overlap.
- Uses the returned `decor_image_url` directly in MascotCanvas.
- Existing admin upload/preview and audience settings are preserved.

Run migration: `supabase/migrations/20261022104500_v1642_active_universe_rpc.sql`.
