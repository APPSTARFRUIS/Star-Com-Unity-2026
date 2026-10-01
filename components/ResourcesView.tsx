import React, { useEffect, useMemo, useState } from 'react';
import { ResourceItem, User } from '../types';
import { supabase } from '../supabaseClient';
import { canViewAudience } from '../audience';

interface Props { currentUser: User; onOpenGames: () => void; }

const ResourcesView: React.FC<Props> = ({ currentUser, onOpenGames }) => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Toutes');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase.from('learning_resources').select('*').eq('published', true).order('sort_order').order('created_at', { ascending: false });
      if (active && !error && data) setResources(data.map((r:any) => ({
        id:r.id, title:r.title, summary:r.summary || '', content:r.content || '', category:r.category || 'Général', mediaType:r.media_type || 'text', resourceUrl:r.resource_url || '', thumbnailUrl:r.thumbnail_url || '', audienceCompanies:r.audience_companies || ['ALL'], published:r.published !== false, sortOrder:r.sort_order || 0, createdAt:r.created_at
      })).filter((r:ResourceItem) => canViewAudience(currentUser, r.audienceCompanies)));
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [currentUser.id, currentUser.company]);

  const categories = useMemo(() => ['Toutes', ...Array.from(new Set(resources.map(r => r.category).filter(Boolean)))], [resources]);
  const visible = useMemo(() => resources.filter(r => (category === 'Toutes' || r.category === category) && `${r.title} ${r.summary} ${r.content}`.toLowerCase().includes(search.toLowerCase())), [resources, category, search]);

  const typeLabel = (type:string) => type === 'video' ? 'Vidéo' : type === 'document' ? 'Document' : type === 'image' ? 'Image' : type === 'link' ? 'Lien' : 'À lire';

  return <div className="max-w-6xl mx-auto p-4 md:p-8 text-left space-y-7">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.25em] text-green-700">Ressources & Jeux</p><h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">Ressources</h1><p className="text-slate-500 mt-2">Retrouvez les contenus utiles pour apprendre, comprendre et préparer les quiz.</p></div>
      <div className="flex rounded-2xl bg-slate-100 p-1 w-fit"><button className="px-5 py-2.5 rounded-xl bg-white shadow-sm font-black text-green-800">Ressources</button><button onClick={onOpenGames} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:text-green-800">Jeux</button></div>
    </div>
    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une ressource..." className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-green-500" />
      <select value={category} onChange={e=>setCategory(e.target.value)} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold">{categories.map(c=><option key={c}>{c}</option>)}</select>
    </div>
    {loading ? <div className="py-16 text-center text-slate-400 font-bold">Chargement des ressources…</div> : visible.length === 0 ? <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center"><h3 className="font-black text-slate-700">Aucune ressource disponible</h3><p className="text-sm text-slate-400 mt-2">Les contenus publiés apparaîtront ici.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{visible.map(r=><article key={r.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {(r.thumbnailUrl || (r.mediaType === 'image' && r.resourceUrl)) ? <img src={r.thumbnailUrl || r.resourceUrl} className="w-full h-40 object-cover" alt="" /> : <div className="h-32 bg-gradient-to-br from-green-50 to-slate-50 flex items-center justify-center text-4xl">{r.mediaType === 'video' ? '▶' : r.mediaType === 'document' ? '▤' : '✦'}</div>}
      <div className="p-5 flex-1 flex flex-col"><div className="flex gap-2 mb-3"><span className="text-[10px] uppercase tracking-widest font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full">{r.category}</span><span className="text-[10px] uppercase tracking-widest font-black text-slate-400 px-2 py-1">{typeLabel(r.mediaType)}</span></div><h2 className="text-xl font-black text-slate-900">{r.title}</h2>{r.summary && <p className="text-sm text-slate-500 mt-2">{r.summary}</p>}{r.content && <p className="text-sm text-slate-700 mt-4 whitespace-pre-line line-clamp-5">{r.content}</p>}{r.resourceUrl && <a href={r.resourceUrl} target="_blank" rel="noreferrer" className="mt-auto pt-5 text-sm font-black text-green-700 hover:text-green-900">{r.mediaType === 'video' ? 'Voir la vidéo →' : r.mediaType === 'document' ? 'Ouvrir le document →' : r.mediaType === 'image' ? 'Voir l’image →' : 'Consulter →'}</a>}</div>
    </article>)}</div>}
  </div>;
};
export default ResourcesView;
