import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CompanyGame, GamePrediction, Idea, Newsletter, Post, User } from '../types';
import { supabase } from '../supabaseClient';

type Period = 7 | 30 | 90;
type Props = { users: User[]; posts: Post[]; ideas: Idea[]; newsletters: Newsletter[]; games: CompanyGame[]; predictions: GamePrediction[] };
type RemoteStats = {
  comments:number; messages:number; notifications:number; unreadNotifications:number; documents:number; events:number; polls:number;
  pushSubscriptions:number; resources:number|null; activeUserIds:string[]; newsletterUniqueReaders:number; newsletterOpens:number;
};
const EMPTY: RemoteStats = { comments:0,messages:0,notifications:0,unreadNotifications:0,documents:0,events:0,polls:0,pushSubscriptions:0,resources:null,activeUserIds:[],newsletterUniqueReaders:0,newsletterOpens:0 };

const Card = ({label,value,detail,accent}:{label:string;value:string|number;detail?:string;accent?:boolean}) => <div className={`bg-white border rounded-3xl p-5 shadow-sm ${accent?'border-purple-200 ring-1 ring-purple-100':'border-slate-200'}`}><div className="text-[11px] uppercase tracking-widest font-black text-slate-400">{label}</div><div className={`mt-2 text-3xl font-black ${accent?'text-purple-700':'text-slate-800'}`}>{value}</div>{detail && <div className="mt-1 text-xs font-semibold text-slate-500">{detail}</div>}</div>;
const Bar = ({label,value,max,suffix=''}:{label:string;value:number;max:number;suffix?:string}) => <div><div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{label}</span><span>{value}{suffix}</span></div><div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-purple-600" style={{width:`${max ? Math.max(value?3:0,(value/max)*100) : 0}%`}} /></div></div>;

const AdminStatsDashboard: React.FC<Props> = ({users,posts,ideas,newsletters,games,predictions}) => {
  const [period,setPeriod] = useState<Period>(30);
  const [remote,setRemote] = useState<RemoteStats>(EMPTY);
  const [loading,setLoading] = useState(false);
  const [updatedAt,setUpdatedAt] = useState<Date|null>(null);
  const since = useMemo(() => new Date(Date.now()-period*86400000).toISOString(),[period]);
  const isRecent = (v:any) => { const raw=v?.createdAt ?? v?.created_at ?? v?.publishedAt ?? v?.published_at ?? v?.submittedAt ?? v?.submitted_at; return raw ? new Date(raw).getTime() >= new Date(since).getTime() : false; };

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Same protection as ResourcesView: installed desktop PWA may mount before
      // the persisted Supabase session has finished restoring.
      await supabase.auth.getSession();
      const count = async (table:string, recent=true, extra?: (q:any)=>any) => {
        let q:any = supabase.from(table).select('*',{count:'exact',head:true});
        if (recent) q=q.gte('created_at',since);
        if (extra) q=extra(q);
        const {count,error}=await q;
        if (error) { console.warn(`[Stats Admin] ${table}:`,error.message); return 0; }
        return count || 0;
      };
      const safeCount = async (table:string, recent=true) => { try { return await count(table,recent); } catch { return 0; } };
      const selectActors = async (table:string, column:string, dateColumn='created_at') => {
        try {
          const {data,error}=await supabase.from(table).select(column).gte(dateColumn,since);
          if(error) return [] as string[];
          return (data||[]).map((r:any)=>String(r[column]||'')).filter(Boolean);
        } catch { return [] as string[]; }
      };
      const loadNewsletterReads = async () => {
        try {
          const {data,error}=await supabase.from('newsletter_reads').select('user_id,newsletter_id,open_count,last_opened_at').gte('last_opened_at',since);
          return error ? [] : (data || []);
        } catch { return []; }
      };
      const [comments,messages,notifications,unreadNotifications,documents,events,polls,pushSubscriptions,
        commentUsers,messageUsers,newsletterReads] = await Promise.all([
        safeCount('comments'),safeCount('messages'),safeCount('notifications'),count('notifications',true,q=>q.eq('is_read',false)),safeCount('documents',false),safeCount('events'),safeCount('polls'),safeCount('push_subscriptions',false),
        selectActors('comments','user_id'), selectActors('messages','sender_id'), loadNewsletterReads()
      ]);
      let resources:number|null=null;
      try { const r=await supabase.from('learning_resources').select('*',{count:'exact',head:true}); if(!r.error) resources=r.count||0; } catch { /* optional */ }

      const localActors = [
        ...posts.filter(isRecent).map((p:any)=>p.userId||p.user_id),
        ...ideas.filter(isRecent).map((i:any)=>i.userId||i.user_id),
        ...predictions.filter(isRecent).map((p:any)=>p.userId||p.user_id),
      ].filter(Boolean).map(String);
      const newsletterActors=(newsletterReads as any[]).map(r=>String(r.user_id||'')).filter(Boolean);
      const activeUserIds=Array.from(new Set([...localActors,...commentUsers,...messageUsers,...newsletterActors]));
      const newsletterUniqueReaders=new Set(newsletterActors).size;
      const newsletterOpens=(newsletterReads as any[]).reduce((sum,r)=>sum+Number(r.open_count||1),0);
      setRemote({comments,messages,notifications,unreadNotifications,documents,events,polls,pushSubscriptions,resources,activeUserIds,newsletterUniqueReaders,newsletterOpens});
      setUpdatedAt(new Date());
    } finally { setLoading(false); }
  },[since,posts,ideas,predictions]);
  useEffect(()=>{ void refresh(); },[refresh]);

  const recentPosts=posts.filter(isRecent).length, recentIdeas=ideas.filter(isRecent).length;
  const recentPredictions=predictions.filter(isRecent).length;
  const activeGames=games.filter((g:any)=>g.isActive ?? g.is_active).length;
  const totalUsers=Math.max(1,users.length);
  const activeUsers=remote.activeUserIds.length;
  const engagementRate=Math.min(100,Math.round((activeUsers/totalUsers)*100));
  const newsletterReach=Math.min(100,Math.round((remote.newsletterUniqueReaders/totalUsers)*100));
  const interactionTotal=recentPosts+recentIdeas+remote.comments+remote.messages+remote.polls+recentPredictions;
  const bars=[['Publications',recentPosts],['Commentaires',remote.comments],['Messages',remote.messages],['Idées',recentIdeas],['Sondages',remote.polls],['Pronostics',recentPredictions]] as [string,number][];
  const max=Math.max(1,...bars.map(x=>x[1]));

  return <div className="space-y-6 animate-in fade-in duration-300">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-800">Dashboard statistiques</h2><p className="text-sm text-slate-500 mt-1">Adoption, engagement et utilité de Star Com'Unity — indicateurs globaux, sans suivi individuel.</p></div><div className="flex items-center gap-2">{([7,30,90] as Period[]).map(p=><button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-2 rounded-xl text-xs font-black ${period===p?'bg-purple-600 text-white':'bg-white border border-slate-200 text-slate-500'}`}>{p} jours</button>)}<button onClick={()=>void refresh()} disabled={loading} className="px-3 py-2 rounded-xl text-xs font-black bg-slate-900 text-white disabled:opacity-50">{loading?'Actualisation…':'Actualiser'}</button></div></div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card label={`Taux d'engagement · ${period} j`} value={`${engagementRate}%`} detail={`${activeUsers} utilisateur${activeUsers>1?'s':''} actif${activeUsers>1?'s':''} sur ${users.length}`} accent />
      <Card label="Portée newsletters" value={`${newsletterReach}%`} detail={`${remote.newsletterUniqueReaders} lecteur${remote.newsletterUniqueReaders>1?'s':''} unique${remote.newsletterUniqueReaders>1?'s':''} sur la période`} accent />
      <Card label={`Interactions · ${period} j`} value={interactionTotal} detail="actions et échanges cumulés" />
      <Card label="Contenus disponibles" value={remote.documents+newsletters.length+(remote.resources||0)} detail={`${remote.documents} documents · ${newsletters.length} newsletters${remote.resources!==null?` · ${remote.resources} ressources`:''}`} />
    </div>

    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"><h3 className="font-black text-slate-800">Engagement sur {period} jours</h3><p className="text-xs text-slate-400 mt-1 mb-5">Ce que les collaborateurs font réellement dans l'application</p><div className="space-y-4">{bars.map(([l,v])=><Bar key={l} label={l} value={v} max={max}/>)}</div></section>
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"><h3 className="font-black text-slate-800">Adoption & communication</h3><p className="text-xs text-slate-400 mt-1 mb-5">Indicateurs directement exploitables pour mesurer l'utilité</p><div className="space-y-5"><Bar label="Utilisateurs actifs" value={engagementRate} max={100} suffix="%"/><Bar label="Portée newsletters" value={newsletterReach} max={100} suffix="%"/><div className="grid grid-cols-2 gap-3 pt-2"><div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black text-slate-800">{remote.newsletterUniqueReaders}</div><div className="text-xs font-bold text-slate-500 mt-1">lecteurs uniques newsletters</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black text-slate-800">{remote.newsletterOpens}</div><div className="text-xs font-bold text-slate-500 mt-1">ouvertures newsletters</div></div></div></div></section>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Card label="Jeux actifs" value={activeGames} detail={`${games.length} jeux au total`}/><Card label="Pronostics" value={predictions.length} detail={`${recentPredictions} participations sur ${period} j`}/><Card label="Push actifs" value={remote.pushSubscriptions} detail={`${remote.notifications} notifications créées sur ${period} j`}/><Card label="Notifications non lues" value={remote.unreadNotifications} detail="volume global actuel"/></div>
    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex flex-wrap justify-between gap-2"><span>Engagement = utilisateurs uniques ayant réalisé au moins une action significative sur la période. Une newsletter est comptée comme lue lorsqu'elle est ouverte ; le suivi nominatif n'est pas affiché.</span>{updatedAt&&<span>Actualisé à {updatedAt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}</div>
  </div>;
};
export default AdminStatsDashboard;
