-- Star Com'Unity - verrou de sécurité des notifications externes avant lancement
ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS notifications_test_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications_test_email text;

UPDATE public.app_config
SET notifications_test_mode = true,
    notifications_test_email = COALESCE(NULLIF(notifications_test_email, ''), 'ludivine.tramier@star-fruits.com')
WHERE id = 1;
