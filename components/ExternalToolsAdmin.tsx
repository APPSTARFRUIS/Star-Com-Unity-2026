import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppConfig, ExternalTool, OrgEntity } from '../types';
import { uploadMediaToStorage } from '../storageUtils';

const emptyTool = (): ExternalTool => ({ id: `tool-${Date.now()}`, name: '', description: '', logoUrl: '', url: '', audienceCompanies: ['*'], sortOrder: 1, enabled: true });

const ExternalToolsAdmin: React.FC<{ appConfig: AppConfig; orgEntities: OrgEntity[]; onUpdateConfig: (config: AppConfig) => Promise<void> | void }> = ({ appConfig, orgEntities, onUpdateConfig }) => {
  const [draft, setDraft] = useState<ExternalTool>(emptyTool());
  const [tools, setTools] = useState<ExternalTool[]>(() => [...(appConfig.externalTools || [])].sort((a,b)=>a.sortOrder-b.sortOrder));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const draftFileRef = useRef<HTMLInputElement>(null);
  const toolFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!dirty && !saving) setTools([...(appConfig.externalTools || [])].sort((a,b)=>a.sortOrder-b.sortOrder));
  }, [appConfig.externalTools, dirty, saving]);

  const companies = useMemo(() => orgEntities.filter(e => e.active && e.entityType !== 'shareholder').sort((a,b)=>a.sortOrder-b.sortOrder), [orgEntities]);

  const persist = async (next: ExternalTool[]) => {
    setSaving(true);
    try {
      await onUpdateConfig({ ...appConfig, externalTools: next });
      setTools(next);
      setDirty(false);
      return true;
    } catch (error) {
      console.error('External tools save failed', error);
      alert("Impossible d'enregistrer Mes outils. Vérifiez la configuration Supabase puis réessayez.");
      return false;
    } finally { setSaving(false); }
  };

  const uploadLogo = async (file: File | undefined, toolId?: string) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Choisissez un fichier image.');
    const key = toolId || 'draft';
    setUploadingId(key);
    try {
      const url = await uploadMediaToStorage(file, 'external-tools/logos');
      if (toolId) {
        setTools(current => current.map(t => t.id === toolId ? { ...t, logoUrl: url } : t));
        setDirty(true);
      } else {
        setDraft(current => ({ ...current, logoUrl: url }));
      }
    } catch (error: any) {
      console.error('External tool logo upload failed', error);
      alert(error?.message || "Erreur lors de l’upload de l’icône.");
    } finally { setUploadingId(null); }
  };

  const add = async () => {
    if (!draft.name.trim() || !draft.url.trim()) return alert('Nom et URL sont obligatoires.');
    const url = /^https?:\/\//i.test(draft.url) ? draft.url : `https://${draft.url}`;
    const next = [...tools, { ...draft, id: draft.id || `tool-${Date.now()}`, name: draft.name.trim(), url, sortOrder: tools.length + 1 }];
    if (await persist(next)) setDraft(emptyTool());
  };

  const patchLocal = (id:string, changes:Partial<ExternalTool>) => { setTools(current => current.map(t => t.id === id ? { ...t, ...changes } : t)); setDirty(true); };
  const remove = async (id:string) => { if (window.confirm('Supprimer cet outil ?')) await persist(tools.filter(t=>t.id!==id).map((t,i)=>({...t,sortOrder:i+1}))); };
  const toggleAudience = (tool:ExternalTool, company:string) => {
    const current = tool.audienceCompanies || ['*'];
    const next = company === '*' ? ['*'] : current.includes('*') ? [company] : current.includes(company) ? current.filter(x=>x!==company) : [...current, company];
    patchLocal(tool.id, { audienceCompanies: next.length ? next : ['*'] });
  };

  const LogoPicker = ({ logoUrl, onChoose, onRemove, uploading }: { logoUrl?: string; onChoose: () => void; onRemove: () => void; uploading: boolean }) => <div className="flex flex-wrap items-center gap-3 bg-slate-50 border rounded-2xl p-3">
    <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">{logoUrl ? <img src={logoUrl} alt="Aperçu de l’icône" className="w-full h-full object-contain p-1.5"/> : <span className="text-[10px] font-black uppercase text-slate-400">Icône</span>}</div>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={uploading} onClick={onChoose} className="px-4 py-2 rounded-xl bg-green-50 text-green-800 font-black text-xs disabled:opacity-50">{uploading ? 'Chargement…' : logoUrl ? 'Remplacer l’icône' : 'Charger une icône'}</button>
      {logoUrl && <button type="button" disabled={uploading} onClick={onRemove} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-black text-xs disabled:opacity-50">Supprimer l’icône</button>}
    </div>
  </div>;

  return <div className="max-w-4xl space-y-7 text-left">
    <div><h2 className="text-2xl font-black text-slate-800">Mes outils</h2><p className="text-slate-500 mt-1">Applications externes visibles par les salariés selon leur entreprise.</p></div>
    <div className="bg-white border border-slate-200 rounded-[32px] p-6 space-y-4">
      <h3 className="font-black text-slate-800">Ajouter un outil</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="bg-slate-50 border rounded-2xl px-4 py-3" placeholder="Nom" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
        <input className="bg-slate-50 border rounded-2xl px-4 py-3" placeholder="Description" value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})}/>
        <input className="bg-slate-50 border rounded-2xl px-4 py-3 md:col-span-2" placeholder="https://..." value={draft.url} onChange={e=>setDraft({...draft,url:e.target.value})}/>
      </div>
      <input ref={draftFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={e=>{void uploadLogo(e.target.files?.[0]); e.target.value='';}}/>
      <LogoPicker logoUrl={draft.logoUrl} uploading={uploadingId==='draft'} onChoose={()=>draftFileRef.current?.click()} onRemove={()=>setDraft(current=>({...current,logoUrl:''}))}/>
      <button disabled={saving || uploadingId==='draft'} onClick={add} className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-black disabled:opacity-50">{saving ? 'Enregistrement…' : '+ Ajouter'}</button>
    </div>
    <div className="space-y-4">{tools.map(tool=><div key={tool.id} className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3"><input className="font-black text-lg flex-1 min-w-48 border-b outline-none" value={tool.name} onChange={e=>patchLocal(tool.id,{name:e.target.value})}/><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={tool.enabled} onChange={e=>patchLocal(tool.id,{enabled:e.target.checked})}/> Actif</label><button disabled={saving} onClick={()=>remove(tool.id)} className="text-red-600 font-bold text-sm disabled:opacity-50">Supprimer</button></div>
      <div className="grid md:grid-cols-2 gap-3"><input className="bg-slate-50 border rounded-xl px-3 py-2" value={tool.description||''} onChange={e=>patchLocal(tool.id,{description:e.target.value})}/><input className="bg-slate-50 border rounded-xl px-3 py-2" value={tool.url} onChange={e=>patchLocal(tool.id,{url:e.target.value})}/></div>
      <input ref={el=>{toolFileRefs.current[tool.id]=el;}} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={e=>{void uploadLogo(e.target.files?.[0],tool.id); e.target.value='';}}/>
      <LogoPicker logoUrl={tool.logoUrl} uploading={uploadingId===tool.id} onChoose={()=>toolFileRefs.current[tool.id]?.click()} onRemove={()=>patchLocal(tool.id,{logoUrl:''})}/>
      <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Visible par</p><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>toggleAudience(tool,'*')} className={`px-3 py-2 rounded-xl text-xs font-bold ${tool.audienceCompanies.includes('*')?'bg-green-700 text-white':'bg-slate-100 text-slate-600'}`}>Toutes les entreprises</button>{companies.map(c=><button type="button" key={c.id} onClick={()=>toggleAudience(tool,c.name)} className={`px-3 py-2 rounded-xl text-xs font-bold ${tool.audienceCompanies.includes(c.name)?'bg-green-700 text-white':'bg-slate-100 text-slate-600'}`}>{c.name}</button>)}</div></div>
    </div>)}</div>
    {tools.length > 0 && <div className="flex items-center gap-3"><button disabled={!dirty || saving || !!uploadingId} onClick={()=>persist(tools)} className="px-6 py-3 rounded-2xl bg-green-700 text-white font-black disabled:opacity-40">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button>{dirty && !saving && <span className="text-sm font-bold text-amber-600">Modifications non enregistrées</span>}</div>}
  </div>;
};
export default ExternalToolsAdmin;
