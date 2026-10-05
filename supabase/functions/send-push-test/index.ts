import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    const admin = createClient(url, serviceKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) throw new Error('Session invalide.');
    const { data: profile } = await admin.from('profiles').select('id,email,role').eq('id', authData.user.id).single();
    if (!profile || String(profile.role).toUpperCase() !== 'ADMIN') throw new Error('Accès administrateur requis.');

    const { data: config } = await admin.from('app_config').select('notifications_test_mode,notifications_test_email').eq('id', 1).single();
    if (!config?.notifications_test_mode) throw new Error('Le mode test doit rester activé.');
    if ((profile.email || '').trim().toLowerCase() !== (config.notifications_test_email || '').trim().toLowerCase()) throw new Error('Ce compte n’est pas le destinataire autorisé du mode test.');

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) throw new Error('Secrets VAPID manquants dans Supabase.');
    webpush.setVapidDetails('mailto:' + profile.email, publicKey, privateKey);

    const { data: subscriptions, error } = await admin.from('push_subscriptions').select('*').eq('user_id', profile.id);
    if (error) throw error;
    if (!subscriptions?.length) throw new Error('Aucun appareil push enregistré.');
    const payload = JSON.stringify({ title: 'Star Com’Unity', body: 'Test réussi : les notifications push fonctionnent sur cet appareil.', url: '/' });
    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
    if (!sent) throw new Error('Aucun push n’a pu être délivré.');
    return new Response(JSON.stringify({ ok: true, sent }), { headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Erreur push.' }), { status: 400, headers });
  }
});
