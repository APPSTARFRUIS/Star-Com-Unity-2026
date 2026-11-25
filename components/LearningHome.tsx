import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Row = { id: string; title: string; learning_path?: string; level_number?: number; level_title?: string; status: string };
export default function LearningHome({userId,onResources,onGames}: {userId:string;onResources:()=>void;onGames:()=>void}) {
  const [data,setData] = useState<{games:Row[];passed:Set<string>}|null>(null);
  const [error,setError] = useState(false);
  const [retry,setRetry] = useState(0);
  useEffect(()=>{
    let active=true;
    setError(false); setData(null);
    async function load(){
      try {
        if(!supabase) throw new Error('Connexion indisponible');
        const games:Row[]=[]; const passed=new Set<string>();
        for(let offset=0;;offset+=500){
          const result=await supabase.from('games').select('id,title,learning_path,level_number,level_title,status').neq('type','Pari').in('status',['Actif','Terminé']).order('id').range(offset,offset+499);
          if(result.error) throw result.error;
          games.push(...(result.data||[])); if((result.data||[]).length<500) break;
        }
        for(let offset=0;;offset+=500){
          const result=await supabase.from('game_completions').select('game_id').eq('user_id',userId).eq('passed',true).order('game_id').range(offset,offset+499);
          if(result.error) throw result.error;
          (result.data||[]).forEach(r=>passed.add(r.game_id)); if((result.data||[]).length<500) break;
        }
        if(active) setData({games,passed});
      } catch { if(active) setError(true); }
    }
    void load(); return ()=>{active=false;};
  },[userId,retry]);
  const paths=new Map<string,Row[]>();
  data?.games.forEach(g=>{const name=g.learning_path?.trim()||((Number(g.level_number||1)>1||g.level_title)?'Parcours Star ComUnity':'');if(name){const key=name.toLocaleLowerCase('fr-FR').replace(/\s+/g,' ');paths.set(key,[...(paths.get(key)||[]),g]);}});
  const all=[...paths.values()].flat();
  const done=all.filter(g=>data?.passed.has(g.id)).length;
  const finished=[...paths.values()].filter(gs=>gs.every(g=>data?.passed.has(g.id))).length;
  const next=all.filter(g=>g.status==='Actif'&&!data?.passed.has(g.id)).sort((a,b)=>Number(a.level_number||1)-Number(b.level_number||1)).find(g=>Number(g.level_number||1)===1 || [...paths.values()].some(gs=>gs.includes(g)&&gs.some(x=>Number(x.level_number||1)===Number(g.level_number||1)-1)&&gs.filter(x=>Number(x.level_number||1)===Number(g.level_number||1)-1).every(x=>data?.passed.has(x.id))));
  const percent=all.length?Math.round(done/all.length*100):0;
  return <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6"><header><h1 className="text-3xl md:text-4xl font-black text-slate-800">Apprendre & découvrir</h1><p className="text-slate-500 mt-2">Explorez le Groupe et progressez à votre rythme.</p></header><div className="grid md:grid-cols-2 gap-5"><button onClick={onResources} className="text-left bg-green-50 border border-green-100 rounded-3xl p-7"><h2 className="text-2xl font-black text-green-900">Ressources</h2><p className="mt-3 text-slate-600">Découvrez nos métiers, expertises, vidéos et contenus de référence.</p><span className="block mt-6 font-bold text-green-800">Explorer les ressources →</span></button><button onClick={onGames} className="text-left bg-white border border-slate-200 rounded-3xl p-7"><h2 className="text-2xl font-black text-slate-800">Quiz & parcours</h2><p className="mt-3 text-slate-600">Testez vos connaissances et débloquez les niveaux suivants.</p><span className="block mt-6 font-bold text-green-800">Continuer mon parcours →</span></button></div><section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4"><h2 className="text-xl font-black text-slate-800">Votre progression</h2>{error?<div>Progression indisponible. <button onClick={()=>setRetry(x=>x+1)} className="font-bold text-green-800">Réessayer</button></div>:!data?<p>Chargement de votre progression…</p>:!all.length?<p>Aucun parcours pédagogique disponible pour le moment.</p>:<><p className="text-3xl font-black text-green-800">{percent} %</p><div role="progressbar" aria-label="Progression pédagogique" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-green-600" style={{width:`${percent}%`}}/></div><p>{done}/{all.length} activités validées · {finished}/{paths.size} parcours terminés</p>{next&&<div className="bg-slate-50 rounded-2xl p-4"><p className="text-sm font-bold text-slate-500">Prochaine étape recommandée</p><p className="font-black text-slate-800">{next.title} · Niveau {next.level_number||1}</p><div className="flex flex-wrap gap-4 mt-3"><button onClick={onResources} className="font-bold text-green-800">Préparer avec les ressources →</button><button onClick={onGames} className="font-bold text-green-800">Accéder aux quiz →</button></div></div>}</>}</section></div>;
}
