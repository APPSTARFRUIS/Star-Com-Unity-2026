import React,{useEffect,useMemo,useState} from 'react';
import {AppNotification,User} from '../types';
import type {ViewType} from './Sidebar';
import {supabase} from '../supabaseClient';

const labels:Record<string,string>={notifications:'Voir',social:'Voir',sondages:'Répondre',evenements:'Voir',jeux:'J’y vais',tempsforts:'Voir',boutique:'Découvrir',celebrations:'Voir'};

export default function MascotNudge({currentUser,notifications,currentView,onNavigate}:{currentUser:User;notifications:AppNotification[];currentView:ViewType;onNavigate:(v:ViewType)=>void}){
 const [name,setName]=useState('Ma Poire');
 const [dismissed,setDismissed]=useState<string[]>(()=>{try{return JSON.parse(sessionStorage.getItem('mascot_nudge_dismissed')||'[]')}catch{return []}});
 useEffect(()=>{let alive=true;(async()=>{if(!supabase)return;const {data}=await supabase.from('mascots').select('name').eq('user_id',currentUser.id).maybeSingle();if(alive&&data?.name)setName(data.name)})();return()=>{alive=false}},[currentUser.id]);
 const item=useMemo(()=>notifications.filter(n=>!n.isRead&&!dismissed.includes(n.id)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())[0]||null,[notifications,dismissed]);
 if(!item||currentView==='notifications')return null;
 const target=((item.linkView||'notifications') as ViewType);
 const close=()=>{const next=[...dismissed,item.id].slice(-20);setDismissed(next);sessionStorage.setItem('mascot_nudge_dismissed',JSON.stringify(next))};
 return <div className="fixed z-[170] right-3 bottom-3 sm:right-6 sm:bottom-6 max-w-[360px] animate-in slide-in-from-bottom-4 fade-in duration-300">
   <div className="relative bg-white border border-green-200 rounded-[24px] shadow-2xl p-3 pr-4 flex items-center gap-3">
     <button type="button" onClick={close} className="absolute top-1.5 right-2 text-slate-400 hover:text-slate-700 text-lg" aria-label="Fermer">×</button>
     <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-b from-green-50 to-amber-50 overflow-hidden flex items-center justify-center">
       <img src="/mascot-pear.png" alt={name} className="w-full h-full object-contain mascot-happy"/>
     </div>
     <div className="min-w-0 pr-2"><p className="text-[10px] uppercase tracking-widest font-black text-green-700">{name} te signale</p><p className="font-black text-slate-900 text-sm mt-0.5 line-clamp-1">{item.title}</p><p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.message}</p><button type="button" onClick={()=>{close();onNavigate(target)}} className="mt-2 text-xs font-black text-green-700 hover:underline">{labels[item.linkView||'']||'Voir'} →</button></div>
   </div>
 </div>;
}
