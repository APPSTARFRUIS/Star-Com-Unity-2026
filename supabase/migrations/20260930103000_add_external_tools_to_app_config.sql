-- Star Com'Unity V1.5 - catalogue administrable des applications externes.
ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS external_tools jsonb NOT NULL DEFAULT '[{"id":"payfit","name":"PayFit","description":"Mon espace RH","url":"https://app.payfit.com/","audienceCompanies":["*"],"sortOrder":1,"enabled":true}]'::jsonb;

UPDATE public.app_config
SET external_tools = '[{"id":"payfit","name":"PayFit","description":"Mon espace RH","url":"https://app.payfit.com/","audienceCompanies":["*"],"sortOrder":1,"enabled":true}]'::jsonb
WHERE external_tools IS NULL OR external_tools = '[]'::jsonb;
