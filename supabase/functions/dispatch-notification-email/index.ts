import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const json = (data: unknown, status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const labels: Record<string,string> = {newsletter:'Une newsletter',poll:'Un sondage',highlight:'Un temps fort'};
const prefs: Record<string,string> = {newsletter:'newsletters',poll:'polls',highlight:'highlights'};
Deno.serve(async req => {
 const secret = Deno.env.get('NOTIFICATION_WORKER_SECRET');
 if(req.method!=='POST'||!secret||secret.length<32||req.headers.get('x-worker-secret')!==secret) return json({error:'Forbidden'},403);
 const key=Deno.env.get('RESEND_API_KEY'), from=Deno.env.get('NOTIFICATION_FROM'), app=Deno.env.get('NOTIFICATION_APP_URL');
 const url=Deno.env.get('SUPABASE_URL'), role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!key||!from||!app?.startsWith('https://')||!url||!role) return json({error:'Configuration manquante'},503);
 const db=createClient(url,role,{auth:{persistSession:false}});
 const config=async()=>{const {data,error}=await db.from('app_config').select('notifications_test_mode,notifications_test_email').eq('id',1).single(); if(error) throw error; return data;};
 const normalize=(v:unknown)=>String(v??'').trim().toLowerCase();
 const allowed=async()=>{const c=await config(); return c?.notifications_test_mode===true?normalize(c.notifications_test_email):'';};
 const send=async(to:string,subject:string,body:string,id:string)=>fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from,to:[to],subject,text:body})});
 try {
  const target=await allowed(); if(!target) return json({error:'Mode test requis'},409);
  const body=await req.json().catch(()=>null);
  if(!body||!['check','test','dispatch'].includes(body.action)) return json({error:'Action attendue: check, test ou dispatch'},400);
  if(body.action==='check') return json({configured:true,testMode:true});
  if(body.action==='test') {
   const {data,error}=await db.from('profiles').select('email,notification_settings').ilike('email',target).limit(2);
   if(error) throw error;
   if(data?.length!==1||normalize(data[0].email)!==target||data[0].notification_settings?.email!==true||await allowed()!==target) return json({error:'Compte test introuvable ou email désactivé'},409);
   const r=await send(target,'Star Com’Unity — Test email',`Ceci est un test de notification Star Com’Unity.\n\n${app}`,`star-test-${crypto.randomUUID()}`);
   return json({accepted:r.ok,providerStatus:r.status},r.ok?200:502);
  }
  const {data:rows,error}=await db.rpc('claim_notification_emails'); if(error) throw error;
  const counts={sent:0,skipped:0,failed:0,pending:0,updateErrors:0};
  for(const row of rows||[]) {
   let status:'sent'|'skipped'|'failed'|'pending'='pending';
   try {
    const {data:p,error:pe}=await db.from('profiles').select('email,notification_settings').eq('id',row.user_id).maybeSingle(); if(pe) throw pe;
    const pref=prefs[row.kind];
    if(!p||!pref||normalize(p.email)!==target||p.notification_settings?.email!==true||p.notification_settings?.[pref]===false||await allowed()!==target) status='skipped';
    else {const r=await send(target,'Star Com’Unity — Nouvelle information',`${labels[row.kind]} vous attend dans Star Com’Unity.\n\n${app}`,`star-${row.notification_id}`); if(r.ok) status='sent'; else if(r.status>=400&&r.status<500&&![408,429].includes(r.status)) status='failed';}
   } catch { /* retry without personal data */ }
   if(status==='pending'&&row.attempts>=3) status='failed';
   const {error:ue}=await db.from('notification_email_queue').update({status}).eq('notification_id',row.notification_id).eq('claimed_at',row.claimed_at);
   counts[status]++; if(ue) counts.updateErrors++;
  }
  return json(counts,counts.updateErrors?500:200);
 } catch {return json({error:'Service indisponible'},500);}
});
