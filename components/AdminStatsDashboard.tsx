import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CompanyGame, GamePrediction, Idea, Newsletter, Post, User } from '../types';
import { supabase } from '../supabaseClient';

type Period = 7 | 30 | 90;
type Props = { users: User[]; posts: Post[]; ideas: Idea[]; newsletters: Newsletter[]; games: CompanyGame[]; predictions: GamePrediction[] };
type RemoteStats = { comments:number; messages:number; notifications:number; unreadNotifications:number; documents:number; events:number; polls:number; pushSubscriptions:number; resources:number|null };
const EMPTY: RemoteStats = { comments:0,messages:0,notifications:0,unreadNotifications:0,documents:0,events:0,polls:0,pushSubscriptions:0,resources:null };

const Card = ({label,value,detail}:{label:string;value:string|number;detail?:string}) => <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"><div className="text-[11px] uppercase tracking-widest font-black text-slate-400">{label}</div><div className="mt-2 text-3xl font-black text-slate-800">{value}</div>{detail && <div className="mt-1 text-xs font-semibold text-slate-500">{detail}</div>}</div>;
const Bar = ({label,value,max}:{label:string;value:number;max:number}) => <div><div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{label}</span><span>{value}</span></div><div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-purple-600" style={{width:`${max ? Math.max(3,(value/max)*100) : 0}%`}} /></div></div>;

const AdminStatsDashboard: React.FC<Props> = ({users,posts,ideas,newsletters,games,predictions}) => {
  const [period,setPeriod] = useState<Period>(30);
  const [remote,setRemote] = useState<RemoteStats>(EMPTY);
  const [loading,setLoading] = useState(false);
  const [updatedAt,setUpdatedAt] = useState<Date|null>(null);
  const since = useMemo(() => new Date(Date.now()-period*86400000).toISOString(),[period]);
  const isRecent = (v:any) => { const raw=v?.createdAt ?? v?.created_at ?? v?.publishedAt ?? v?.published_at; return raw ? new Date(raw).getTime() >= new Date(since).getTime() : false; };

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const count = async (table:string, recent=true, extra?: (q:any)=>any) => {
      let q:any = supabase.from(table).select('*',{count:'exact',head:true});
      if (recent) q=q.gte('created_at',since);
      if (extra) q=extra(q);
      const {count,error}=await q;
      if (error) { console.warn(`[Stats Admin] ${table}:`,error.message); return 0; }
      return count || 0;
    };
    const safeCount = async (table:string, recent=true) => { try { return await count(table,recent); } catch { return 0; } };
    const [comments,messages,notifications,unreadNotifications,documents,events,polls,pushSubscriptions] = await Promise.all([
      safeCount('comments'),safeCount('messages'),safeCount('notifications'),count('notifications',true,q=>q.eq('is_read',false)),safeCount('documents',false),safeCount('events'),safeCount('polls'),safeCount('push_subscriptions',false)
    ]);
    let resources:number|null=null;
    try { const r=await supabase.from('learning_resources').select('*',{count:'exact',head:true}); if(!r.error) resources=r.count||0; } catch { /* optional table */ }
    setRemote({comments,messages,notifications,unreadNotifications,documents,events,polls,pushSubscriptions,resources});
    setUpdatedAt(new Date()); setLoading(false);
  },[since]);
  useEffect(()=>{ void refresh(); },[refresh]);

  const recentPosts=posts.filter(isRecent).length, recentIdeas=ideas.filter(isRecent).length;
  const recentPredictions=predictions.filter(isRecent).length;
  const activeGames=games.filter((g:any)=>g.isActive ?? g.is_active).length;
  const totalReads=newsletters.reduce((s:any,n:any)=>s+Number(n.readCount ?? n.read_count ?? 0),0);
  const engagement = recentPosts+recentIdeas+remote.comments+remote.messages+remote.polls+recentPredictions;
  const bars=[['Publications',recentPosts],['Commentaires',remote.comments],['Messages',remote.messages],['Idées',recentIdeas],['Sondages',remote.polls],['Pronostics',recentPredictions]] as [string,number][];
  const max=Math.max(1,...bars.map(x=>x[1]));
  const byCompany=Object.entries(users.reduce((a:any,u:any)=>{const k=u.company||'Non renseignée';a[k]=(a[k]||0)+1;return a;},{})).sort((a:any,b:any)=>b[1]-a[1]).slice(0,6) as [string,number][];
  const companyMax=Math.max(1,...byCompany.map(x=>x[1]));

  return <div className="space-y-6 animate-in fade-in duration-300">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-800">Dashboard statistiques</h2><p className="text-sm text-slate-500 mt-1">Vue globale et agrégée de l'utilisation de Star Com'Unity — sans suivi individuel.</p></div><div className="flex items-center gap-2">{([7,30,90] as Period[]).map(p=><button key={p} onClick={()=>setPeriod(p)} className={`px-3 py-2 rounded-xl text-xs font-black ${period===p?'bg-purple-600 text-white':'bg-white border border-slate-200 text-slate-500'}`}>{p} jours</button>)}<button onClick={()=>void refresh()} disabled={loading} className="px-3 py-2 rounded-xl text-xs font-black bg-slate-900 text-white disabled:opacity-50">{loading?'Actualisation…':'Actualiser'}</button></div></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Card label="Utilisateurs" value={users.length} detail={`${byCompany.length} entité${byCompany.length>1?'s':''} représentée${byCompany.length>1?'s':''}`} /><Card label={`Interactions · ${period} j`} value={engagement} detail="activité cumulée"/><Card label="Contenus" value={remote.documents+newsletters.length+(remote.resources||0)} detail={`${remote.documents} documents · ${newsletters.length} newsletters${remote.resources!==null?` · ${remote.resources} ressources`:''}`}/><Card label="Push actifs" value={remote.pushSubscriptions} detail={`${remote.notifications} notifications créées sur ${period} j`}/></div>
    <div className="grid lg:grid-cols-2 gap-5"><section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"><h3 className="font-black text-slate-800">Engagement sur {period} jours</h3><p className="text-xs text-slate-400 mt-1 mb-5">Volumes globaux par type d'action</p><div className="space-y-4">{bars.map(([l,v])=><Bar key={l} label={l} value={v} max={max}/>)}</div></section><section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"><h3 className="font-black text-slate-800">Utilisateurs par entité</h3><p className="text-xs text-slate-400 mt-1 mb-5">Répartition des comptes, sans classement individuel</p><div className="space-y-4">{byCompany.map(([l,v])=><Bar key={l} label={l} value={v} max={companyMax}/>)}</div></section></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Card label="Jeux actifs" value={activeGames} detail={`${games.length} jeux au total`}/><Card label="Pronostics" value={predictions.length} detail={`${recentPredictions} participations sur ${period} j`}/><Card label="Lectures newsletters" value={totalReads} detail={`${newsletters.length} newsletters publiées`}/><Card label="Notifications non lues" value={remote.unreadNotifications} detail="volume global actuel"/></div>
    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex flex-wrap justify-between gap-2"><span>Les indicateurs sont agrégés : aucune durée de connexion ni historique individuel n'est affiché.</span>{updatedAt&&<span>Actualisé à {updatedAt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}</div>
  </div>;
};
export default AdminStatsDashboard;
