import React, { useMemo, useState } from 'react';
import { OrgContact, OrgEntity, OrgService, User, UserRole } from '../types';

interface Props {
  users: User[];
  entities: OrgEntity[];
  services: OrgService[];
  contacts: OrgContact[];
  gamificationStats?: Record<string, { earned: number; purchases: number; gains: number }>;
}
type SubView='list'|'department'|'org';
const norm=(v?:string)=>(v||'').trim().toLocaleLowerCase('fr-FR');

const ProfileModal=({person,onClose}:{person:User|OrgContact,onClose:()=>void})=>{
  const isUser='role' in person;
  const p:any=person;
  return <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-start gap-5"><img src={(isUser?p.avatar:p.avatarUrl)||`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}`} className="w-24 h-24 rounded-3xl object-cover border"/><div className="min-w-0"><h2 className="text-2xl font-black text-slate-900">{p.name}</h2><p className="font-bold text-green-700">{isUser?p.job_function:p.jobTitle}</p>{isUser&&<p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{p.company} · {p.department}</p>}</div></div><div className="mt-6 space-y-3 text-sm"><p><b>Email :</b> {p.email||'—'}</p><p><b>Téléphone :</b> {p.phone||'—'}</p>{p.about&&<p><b>À propos :</b> {p.about}</p>}</div><button onClick={onClose} className="mt-7 w-full py-3 rounded-xl bg-slate-900 text-white font-black">Fermer</button></div></div>
}

const TeamView:React.FC<Props>=({users,entities,services,contacts})=>{
  const [sub,setSub]=useState<SubView>('list');
  const activeEntities=useMemo(()=>entities.filter(e=>e.active).sort((a,b)=>a.sortOrder-b.sortOrder),[entities]);
  const group=activeEntities.find(e=>e.entityType==='group');
  const [selectedEntityId,setSelectedEntityId]=useState(group?.id||activeEntities[0]?.id||'');
  const [query,setQuery]=useState('');
  const [profile,setProfile]=useState<User|OrgContact|null>(null);
  const selectedEntity=activeEntities.find(e=>e.id===selectedEntityId)||group||activeEntities[0];
  const entityUsers=useMemo(()=>selectedEntity?users.filter(u=>norm(u.company)===norm(selectedEntity.name)):[],[users,selectedEntity?.name]);
  const entityServices=useMemo(()=>selectedEntity?services.filter(s=>s.active&&s.entityId===selectedEntity.id).sort((a,b)=>a.sortOrder-b.sortOrder):[],[services,selectedEntity?.id]);
  const filtered=entityUsers.filter(u=>!query||norm(u.name).includes(norm(query))||norm(u.email).includes(norm(query)));
  const entityContacts=contacts.filter(c=>c.entityId===selectedEntity?.id).sort((a,b)=>a.sortOrder-b.sortOrder);

  const choose=(id:string)=>{setSelectedEntityId(id);if(sub==='org')setSub('org')};

  const exportPdf=()=>{
    const children=activeEntities.filter(e=>e.entityType!=='group');
    const pages=[group,...children].filter(Boolean) as OrgEntity[];
    const esc=(s:string)=>s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' } as any)[m]);
    const blocks=pages.map((entity,i)=>{
      const eu=users.filter(u=>norm(u.company)===norm(entity.name));
      const es=services.filter(s=>s.entityId===entity.id&&s.active).sort((a,b)=>a.sortOrder-b.sortOrder);
      const ec=contacts.filter(c=>c.entityId===entity.id);
      if(i===0){return `<section id="entity-${entity.id}" class="page"><h1>${esc(entity.name)}</h1><p>Organigramme général interactif</p><div class="grid">${children.map(ch=>`<a class="box" href="#entity-${ch.id}">${ch.logoUrl?`<img src="${ch.logoUrl}">`:''}<b>${esc(ch.name)}</b><small>${ch.entityType==='shareholder'?'Actionnaire pépiniériste':'Filiale / entreprise'}</small></a>`).join('')}</div></section>`}
      return `<section id="entity-${entity.id}" class="page"><a href="#entity-${group?.id}" class="back">← Retour Star Group</a><h1>${esc(entity.name)}</h1>${entity.logoUrl?`<img class="logo" src="${entity.logoUrl}">`:''}<div class="services">${es.map(s=>`<div><h3>${esc(s.name)}</h3>${eu.filter(u=>u.department===s.name).map(u=>`<a href="#person-${u.id}" class="person">${esc(u.name)}<small>${esc(u.job_function||'')}</small></a>`).join('')||'<em>Aucun membre</em>'}</div>`).join('')}</div>${ec.map(c=>`<div id="person-${c.id}" class="card"><b>${esc(c.name)}</b><br>${esc(c.jobTitle||'')}<br>${esc(c.email||'')}</div>`).join('')}${eu.map(u=>`<div id="person-${u.id}" class="card"><b>${esc(u.name)}</b><br>${esc(u.job_function||'')}<br>${esc(u.email)}</div>`).join('')}</section>`
    }).join('');
    const win=window.open('','_blank');if(!win)return;
    win.document.write(`<!doctype html><html><head><title>Organigramme Star Group</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#0f172a}.page{page-break-after:always;min-height:180mm}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:30px}.box,.person{border:1px solid #cbd5e1;border-radius:14px;padding:16px;text-decoration:none;color:#0f172a;display:flex;flex-direction:column;gap:6px}.box img,.logo{max-width:120px;max-height:70px;object-fit:contain}.services{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.services>div{border:1px solid #e2e8f0;border-radius:14px;padding:12px}.person{margin:8px 0;padding:10px}.person small,.box small{color:#64748b}.card{page-break-inside:avoid;margin:12px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px}.back{color:#166534;text-decoration:none;font-weight:bold}</style></head><body>${blocks}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`);win.document.close();
  };

  return <div className="max-w-7xl mx-auto space-y-7">
    {profile&&<ProfileModal person={profile} onClose={()=>setProfile(null)}/>} 
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h1 className="text-3xl font-black">Annuaire & Équipe</h1><p className="text-slate-500">Star Group, filiales et actionnaires pépiniéristes.</p></div><div className="flex bg-white rounded-2xl border p-1">{[['list','Liste'],['department','Services'],['org','Organigramme']].map(([id,l])=><button key={id} onClick={()=>setSub(id as SubView)} className={`px-5 py-2 rounded-xl font-bold ${sub===id?'bg-[#14532d] text-white':'text-slate-500'}`}>{l}</button>)}</div></div>

    <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-2xl p-3"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 self-center mr-2">Structure</span>{activeEntities.map(e=><button key={e.id} onClick={()=>choose(e.id)} className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${selectedEntity?.id===e.id?'bg-slate-900 text-white':'bg-slate-50 text-slate-600'}`}>{e.logoUrl&&<img src={e.logoUrl} className="w-5 h-5 object-contain bg-white rounded"/>}{e.name}</button>)}</div>

    {sub==='list'&&<div className="space-y-5"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Rechercher dans ${selectedEntity?.name||''}...`} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3"/><div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{filtered.map(u=><button key={u.id} onClick={()=>setProfile(u)} className="bg-white border rounded-2xl p-4 text-left hover:shadow-md"><div className="flex gap-3 items-center"><img src={u.avatar||`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`} className="w-12 h-12 rounded-full object-cover"/><div><p className="font-black">{u.name}</p><p className="text-xs text-slate-400">{u.job_function||u.department}</p></div></div></button>)}{entityContacts.map(c=><button key={c.id} onClick={()=>setProfile(c)} className="bg-white border rounded-2xl p-4 text-left"><p className="font-black">{c.name}</p><p className="text-xs text-slate-400">{c.jobTitle}</p></button>)}</div></div>}

    {sub==='department'&&<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{entityServices.map(service=>{const members=entityUsers.filter(u=>u.department===service.name);return <div key={service.id} className="bg-white border rounded-[28px] overflow-hidden"><div className="p-5 bg-slate-50 border-b flex justify-between"><h3 className="font-black uppercase text-sm">{service.name}</h3><span className="text-xs text-slate-400">{members.length}</span></div><div className="p-4 space-y-2">{members.map(u=><button key={u.id} onClick={()=>setProfile(u)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left"><img src={u.avatar} className="w-9 h-9 rounded-full object-cover"/><div><p className="font-bold">{u.name}</p><p className="text-[10px] text-slate-400">{u.job_function||''}</p></div></button>)}{!members.length&&<p className="text-xs italic text-slate-400 p-3">Aucun membre</p>}</div></div>})}{!entityServices.length&&<div className="col-span-full py-20 text-center text-slate-400 italic">Aucun service configuré pour {selectedEntity?.name}.</div>}</div>}

    {sub==='org'&&<div className="space-y-4"><div className="flex justify-between items-center"><div><p className="text-[10px] font-black uppercase text-slate-400">Organigramme interactif</p><h2 className="text-xl font-black">{selectedEntity?.name}</h2></div><button onClick={exportPdf} className="px-5 py-3 rounded-xl bg-green-700 text-white font-black text-xs">Exporter PDF interactif</button></div>{selectedEntity?.entityType==='group'?<div className="bg-slate-100 rounded-[40px] p-10 min-h-[560px]"><div className="flex justify-center"><button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3">{selectedEntity.logoUrl&&<img src={selectedEntity.logoUrl} className="w-10 h-10 bg-white object-contain rounded"/>}{selectedEntity.name}</button></div><div className="w-px h-12 bg-slate-300 mx-auto"/><div className="grid md:grid-cols-3 gap-5">{activeEntities.filter(e=>e.entityType!=='group').map(e=><button key={e.id} onClick={()=>setSelectedEntityId(e.id)} className="bg-white border rounded-2xl p-5 hover:border-green-500 hover:shadow-lg text-center"><div className="h-16 flex items-center justify-center">{e.logoUrl?<img src={e.logoUrl} className="max-h-14 max-w-[140px] object-contain"/>:<span className="text-slate-300 font-black">LOGO</span>}</div><p className="font-black mt-3">{e.name}</p><p className="text-[10px] uppercase text-slate-400 font-bold mt-1">{e.entityType==='shareholder'?'Actionnaire pépiniériste':'Filiale / entreprise'}</p></button>)}</div></div>:<div className="bg-slate-100 rounded-[40px] p-8 min-h-[560px]"><div className="flex justify-center"><button onClick={()=>group&&setSelectedEntityId(group.id)} className="text-xs font-black text-green-700 mb-4">← Retour Star Group</button></div><div className="flex justify-center"><div className="bg-white border rounded-2xl px-8 py-4 text-center">{selectedEntity?.logoUrl&&<img src={selectedEntity.logoUrl} className="h-16 max-w-[160px] mx-auto object-contain"/>}<h3 className="font-black text-lg mt-2">{selectedEntity?.name}</h3></div></div><div className="grid md:grid-cols-3 gap-5 mt-10">{entityServices.map(s=>{const members=entityUsers.filter(u=>u.department===s.name);return <div key={s.id} className="bg-white border rounded-2xl p-4"><h4 className="text-xs font-black uppercase text-slate-500 text-center mb-4">{s.name}</h4><div className="space-y-2">{members.map(u=><button key={u.id} onClick={()=>setProfile(u)} className="w-full border rounded-xl p-2 text-left hover:border-green-500"><p className="font-bold text-sm">{u.name}</p><p className="text-[10px] text-slate-400">{u.job_function}</p></button>)}</div></div>})}{entityContacts.map(c=><button key={c.id} onClick={()=>setProfile(c)} className="bg-white border rounded-2xl p-4 text-left"><p className="font-black">{c.name}</p><p className="text-xs text-slate-400">{c.jobTitle}</p></button>)}</div></div>}</div>}
  </div>
}
export default TeamView;
