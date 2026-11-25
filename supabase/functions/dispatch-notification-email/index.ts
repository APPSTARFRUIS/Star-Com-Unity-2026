import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
Deno.serve(async req => {
 const secret = Deno.env.get('NOTIFICATION_WORKER_SECRET');
 if (req.method !== 'POST' || !secret || req.headers.get('x-worker-secret') !== secret) return new Response('Forbidden',{status:403});
 const key = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('NOTIFICATION_FROM'), app = Deno.env.get('NOTIFICATION_APP_URL');
 if (!key || !from || !app || !app.startsWith('https://')) return new Response('Configuration manquante',{status:503});
 const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data: config,error: configError}=await db.from('app_config').select('notifications_test_mode,notifications_test_email').eq('id',1).single();
 if(configError || !config?.notifications_test_mode) return new Response('Mode test requis',{status:409});
 const {data: rows,error}=await db.rpc('claim_notification_emails');
 if(error) return new Response('File indisponible',{status:500});
 let sent=0;
 for(const row of rows || []) {
  let status='pending';
  try {
   const {data:p,error:pe}=await db.from('profiles').select('email,notification_settings').eq('id',row.user_id).maybeSingle();
   if(pe) throw pe;
   const pref=({newsletter:'newsletters',poll:'polls',highlight:'highlights'} as Record<string,string>)[row.kind];
   if(!p || !pref || p.email?.trim().toLowerCase()!==config.notifications_test_email?.trim().toLowerCase() || p.notification_settings?.email!==true || p.notification_settings?.[pref]===false) status='skipped';
   else {
    const label=({newsletter:'Une newsletter',poll:'Un sondage',highlight:'Un temps fort'} as Record<string,string>)[row.kind];
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`star-${row.notification_id}`},body:JSON.stringify({from,to:[p.email],subject:'Star Com’Unity — Nouvelle information',text:`${label} vous attend dans Star Com’Unity.\n\n${app}`})});
    if(response.ok){status='sent';sent++;} else if(response.status>=400 && response.status<500 && response.status!==429) status='failed';
   }
  } catch { /* retry, without logging personal data */ }
  if(status==='pending' && row.attempts>=3) status='failed';
  await db.from('notification_email_queue').update({status}).eq('notification_id',row.notification_id).eq('claimed_at',row.claimed_at);
 }
 return Response.json({sent});
});
