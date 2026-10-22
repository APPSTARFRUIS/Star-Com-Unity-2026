# V1.6.42 corrective — Univers admin

- Universes are now imposed automatically by Admin; users do not equip them.
- Admin can upload a global decor directly in the universe form.
- Audience: all collaborators or selected companies.
- Mood is automatic/contextual and can be imposed during a programmed universe.
- Dressing remains personal.
- Attributions now load the collaborator directory directly from `profiles`, avoiding stale/mixed data from the Admin page.

SQL to run after push:
`supabase/migrations/20261022081500_v1642_universe_admin_fix.sql`
